"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { erroIa, rodar } from "@/lib/ai/run";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Resultado } from "@/lib/domain/diagnostico";
import { fetchSeguro } from "@/lib/server/safe-fetch";
import { pastaDaAluna } from "@/lib/server/pastas";
import { rateLimit } from "@/lib/server/rate-limit";
import { errMsg, log } from "@/lib/server/log";

export type R = { ok?: boolean; erro?: string };
const reval = () => revalidatePath("/app", "layout");

async function pasta(id: string) {
  if (!z.string().uuid().safeParse(id).success) throw new Error("pasta inválida");
  const p = await pastaDaAluna(id);
  if (!p) throw new Error("pasta não encontrada");
  return p;
}

/** Junta campos em student_products.dados (nunca apaga o resto). */
async function salvarDados(id: string, patch: Record<string, unknown>) {
  await db()
    .update(schema.studentProducts)
    .set({ dados: sql`${schema.studentProducts.dados} || ${JSON.stringify(patch)}::jsonb` })
    .where(eq(schema.studentProducts.id, id));
}

async function contextoAluna(studentId: string) {
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, studentId), orderBy: desc(schema.diagnostics.versao) });
  return { respostas: d?.respostas ?? {}, resultado: (d?.resultado as Resultado | null) ?? null };
}

const IDIOMA_PAIS: Record<string, string> = { eua: "en", uk: "en", latam: "es", esp: "es" };
export async function idiomaDaPasta(paisVenda: string | null) {
  return IDIOMA_PAIS[paisVenda ?? ""] ?? "en";
}

/** P1 · "+ Criar produto com a IA" e "Quero ser afiliada do SDM". */
export async function novaPasta(tipo: "sdm" | "proprio") {
  const t = z.enum(["sdm", "proprio"]).parse(tipo);
  const { student } = await requireStudent();
  if (t === "sdm") {
    const ja = await db().query.studentProducts.findFirst({ where: and(eq(schema.studentProducts.studentId, student.id), eq(schema.studentProducts.tipo, "sdm")) });
    if (ja) redirect(`/app/p/${ja.id}`);
  }
  const { resultado } = await contextoAluna(student.id);
  const n = await db().select({ n: sql<number>`count(*)::int` }).from(schema.studentProducts).where(and(eq(schema.studentProducts.studentId, student.id), eq(schema.studentProducts.tipo, "proprio")));
  const pais = resultado?.pais_venda?.k ?? null;
  const [p] = await db()
    .insert(schema.studentProducts)
    .values({
      studentId: student.id,
      tipo: t,
      nome: t === "sdm" ? "SDM · afiliada" : `Meu produto${(n[0]?.n ?? 0) > 0 ? ` ${(n[0]?.n ?? 0) + 1}` : ""}`,
      paisVenda: pais,
      paisConfirmado: Boolean(pais),
      bioCode: randomBytes(5).toString("base64url").toLowerCase(),
    })
    .returning({ id: schema.studentProducts.id });
  await db().update(schema.students).set({ produtoAtivo: p!.id, ...(student.caminho ? {} : { caminho: t === "sdm" ? "afiliada" : "produto" }) }).where(eq(schema.students.id, student.id));
  reval();
  redirect(`/app/p/${p!.id}`);
}

/** Marca/desmarca uma etapa ou item como feito (Entenda, conta, regras, revisão...). */
export async function marcarFeito(pastaId: string, chave: string, valor = true) {
  const { pasta: p } = await pasta(pastaId);
  const feito = { ...((p.dados as { feito?: Record<string, boolean> }).feito ?? {}), [z.string().max(40).parse(chave)]: valor };
  await salvarDados(p.id, { feito });
  await db().update(schema.students).set({ produtoAtivo: p.id }).where(eq(schema.students.id, p.studentId));
  reval();
  return { ok: true };
}

/** Item de checklist (índice) ligado/desligado. */
export async function marcarItem(pastaId: string, lista: string, idx: number, on: boolean) {
  const { pasta: p } = await pasta(pastaId);
  const checks = { ...((p.dados as { checks?: Record<string, number[]> }).checks ?? {}) };
  const atual = new Set(checks[lista] ?? []);
  if (on) atual.add(idx);
  else atual.delete(idx);
  checks[z.string().max(40).parse(lista)] = [...atual].sort((a, b) => a - b);
  await salvarDados(p.id, { checks });
  reval();
  return { ok: true };
}

/** A1 · pedir afiliação ao SDM (o time aprova no admin). */
export async function pedirAfiliacao(pastaId: string) {
  const { pasta: p } = await pasta(pastaId);
  if (p.tipo !== "sdm") throw new Error("pasta errada");
  await salvarDados(p.id, { afiliacao: { status: "analise", pedidoEm: new Date().toISOString() } });
  reval();
  return { ok: true };
}

/** D0 · pago, orgânico ou os dois. */
export async function escolherDivulgacao(pastaId: string, v: string) {
  const d = z.enum(["pago", "org", "ambos"]).parse(v);
  const { pasta: p } = await pasta(pastaId);
  await db().update(schema.studentProducts).set({ divulgacao: d }).where(eq(schema.studentProducts.id, p.id));
  if (d !== "org") await db().update(schema.students).set({ trilhaPago: true }).where(eq(schema.students.id, p.studentId));
  if (d !== "pago") await db().update(schema.students).set({ trilhaOrg: true }).where(eq(schema.students.id, p.studentId));
  reval();
  redirect(`/app/p/${p.id}`);
}

// ---------- Caminho B · produto próprio com IA ----------

/** B1 · 3 ideias (ou "me dá outras 3"). */
export async function gerarIdeias(pastaId: string, outras: boolean): Promise<R> {
  const { pasta: p, student } = await pasta(pastaId);
  const ctx = await contextoAluna(student.id);
  const anteriores = ((p.dados as { ideias?: { nome_provisorio: string }[] }).ideias ?? []).map((i) => i.nome_provisorio);
  try {
    const r = await rodar(
      "ideias",
      { idioma_venda: await idiomaDaPasta(p.paisVenda), pais_venda: p.paisVenda, diagnostico: ctx.respostas, evitar: outras ? anteriores : [] },
      { studentId: student.id, semCache: outras },
    );
    await salvarDados(p.id, { ideias: r.saida.ideias.slice(0, 3), ideiasPorque: r.saida.por_que_funciona });
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

/** B1 · "Tenho minha própria ideia (a IA avalia)". */
export async function avaliarIdeia(pastaId: string, _p: R | null, form: FormData): Promise<R & { veredito?: string; explicacao?: string }> {
  const texto = z.string().trim().min(10, "Conte a ideia em pelo menos uma frase.").max(1000).safeParse(form.get("ideia"));
  if (!texto.success) return { erro: texto.error.issues[0]?.message };
  const { pasta: p, student } = await pasta(pastaId);
  const ctx = await contextoAluna(student.id);
  try {
    const r = await rodar("avaliar_ideia", { idioma_venda: await idiomaDaPasta(p.paisVenda), pais_venda: p.paisVenda, ideia_da_aluna: texto.data, diagnostico: ctx.respostas }, { studentId: student.id });
    const ideias = [r.saida.ideia_ajustada, ...((p.dados as { ideias?: unknown[] }).ideias ?? [])].slice(0, 4);
    await salvarDados(p.id, { ideias, avaliacao: { veredito: r.saida.veredito, explicacao: r.saida.explicacao, ideia: texto.data } });
    reval();
    return { ok: true, veredito: r.saida.veredito, explicacao: r.saida.explicacao };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

export async function escolherIdeia(pastaId: string, idx: number) {
  const { pasta: p } = await pasta(pastaId);
  const ideias = (p.dados as { ideias?: { nome_provisorio: string }[] }).ideias ?? [];
  const ideia = ideias[idx];
  if (!ideia) throw new Error("ideia inválida");
  await salvarDados(p.id, { ideia });
  await db().update(schema.studentProducts).set({ nome: ideia.nome_provisorio }).where(eq(schema.studentProducts.id, p.id));
  reval();
  redirect(`/app/p/${p.id}/ficha`);
}

/** B2 · perguntas guiadas → a IA completa a ficha. */
export async function gerarFicha(pastaId: string, _p: R | null, form: FormData): Promise<R> {
  const { pasta: p, student } = await pasta(pastaId);
  const ideia = (p.dados as { ideia?: unknown }).ideia;
  if (!ideia) return { erro: "Escolha uma ideia antes (etapa Ideias)." };
  const resp = {
    o_que_sabe: String(form.get("o_que_sabe") ?? "").slice(0, 1500),
    historia_real: String(form.get("historia_real") ?? "").slice(0, 1500),
    nao_prometer: String(form.get("nao_prometer") ?? "").slice(0, 800),
  };
  if (resp.o_que_sabe.trim().length < 5) return { erro: "Conte um pouco do que você sabe sobre o assunto." };
  try {
    const r = await rodar("ficha", { idioma_venda: await idiomaDaPasta(p.paisVenda), pais_venda: p.paisVenda, ideia, respostas_da_aluna: resp }, { studentId: student.id, semCache: true });
    await salvarDados(p.id, { ficha: r.saida, fichaRespostas: resp, fichaMudou: Boolean((p.dados as { ficha?: unknown }).ficha) });
    await db().update(schema.studentProducts).set({ nome: r.saida.nome }).where(eq(schema.studentProducts.id, p.id));
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

/** B2 · corrigir um campo da ficha à mão. */
export async function editarFicha(pastaId: string, campo: string, valor: string): Promise<R> {
  const { pasta: p } = await pasta(pastaId);
  const ficha = (p.dados as { ficha?: Record<string, unknown> }).ficha;
  if (!ficha) return { erro: "Ficha ainda não existe." };
  const c = z.enum(["nome", "publico", "dor", "promessa", "o_que_e"]).parse(campo);
  const v = z.string().trim().min(2).max(600).parse(valor);
  const novo = c === "nome" ? { ...ficha, nome: v } : { ...ficha, [c]: { ...(ficha[c] as object), x: v } };
  await salvarDados(p.id, { ficha: novo, fichaMudou: true });
  reval();
  return { ok: true };
}

/** B3 · oferta. */
export async function gerarOferta(pastaId: string, outra: boolean): Promise<R> {
  const { pasta: p, student } = await pasta(pastaId);
  const ficha = (p.dados as { ficha?: unknown }).ficha;
  if (!ficha) return { erro: "Complete a ficha do produto antes." };
  try {
    const r = await rodar("oferta", { idioma_venda: await idiomaDaPasta(p.paisVenda), pais_venda: p.paisVenda, ficha }, { studentId: student.id, semCache: outra });
    await salvarDados(p.id, { oferta: { ...r.saida, aprovada: false } });
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

export async function aprovarOferta(pastaId: string, _p: R | null, form: FormData): Promise<R> {
  const { pasta: p } = await pasta(pastaId);
  const o = (p.dados as { oferta?: Record<string, unknown> }).oferta;
  if (!o) return { erro: "Gere a oferta antes." };
  const nome = String(form.get("nome") ?? "").trim();
  const preco = Number(String(form.get("preco") ?? "").replace(",", "."));
  const promessa = String(form.get("promessa") ?? "").trim();
  const novo = {
    ...o,
    nome: { ...(o.nome as object), x: nome || (o.nome as { x: string }).x },
    promessa: { ...(o.promessa as object), x: promessa || (o.promessa as { x: string }).x },
    preco: { ...(o.preco as object), valor: Number.isFinite(preco) && preco > 0 ? preco : (o.preco as { valor: number }).valor },
    aprovada: true,
  };
  await salvarDados(p.id, { oferta: novo });
  await db().update(schema.studentProducts).set({ nome: (novo.nome as { x: string }).x }).where(eq(schema.studentProducts.id, p.id));
  reval();
  return { ok: true };
}

/** B6 · página de vendas (pagina, pre ou quiz), escrita bloco por bloco. */
export async function gerarPagina(pastaId: string, formato: string): Promise<R> {
  const f = z.enum(["pagina", "pre", "quiz"]).parse(formato);
  const { pasta: p, student } = await pasta(pastaId);
  const dados = p.dados as { ficha?: unknown; oferta?: unknown };
  if (!dados.ficha) return { erro: "Complete a ficha antes." };
  try {
    const r = await rodar("pagina", { formato: f, idioma_venda: await idiomaDaPasta(p.paisVenda), ficha: dados.ficha, oferta: dados.oferta ?? null }, { studentId: student.id, semCache: true });
    const idioma = await idiomaDaPasta(p.paisVenda);
    await db().insert(schema.generatedItems).values({
      studentProductId: p.id,
      studentId: student.id,
      tipo: f === "quiz" ? "kit_quiz" : "kit_pre",
      idioma,
      conteudo: { formato: f, blocos: r.saida.blocos.map((b) => ({ n: b.n, oq: b.porque, x: b.x, pt: b.pt })), imagemPrompt: r.saida.prompt_imagem },
      porQueFunciona: r.saida.por_que_funciona,
      checagem: r.saida.checagem,
      agente: "AGT-pagina",
      custoUsd: "0",
    });
    reval();
    return { ok: true };
  } catch (e) {
    return { erro: erroIa(e) };
  }
}

/** B6 · editar um bloco à mão. */
export async function editarBloco(itemId: string, idx: number, texto: string): Promise<R> {
  const { student } = await requireStudent();
  const it = await db().query.generatedItems.findFirst({ where: and(eq(schema.generatedItems.id, z.string().uuid().parse(itemId)), eq(schema.generatedItems.studentId, student.id)) });
  if (!it) return { erro: "Item não encontrado." };
  const c = it.conteudo as { blocos: { x: string }[] };
  if (!c.blocos[idx]) return { erro: "Bloco inválido." };
  c.blocos[idx]!.x = z.string().trim().min(1).max(3000).parse(texto);
  await db().update(schema.generatedItems).set({ conteudo: c, status: "rascunho" }).where(eq(schema.generatedItems.id, it.id));
  reval();
  return { ok: true };
}

/** B7 · link do checkout: o app abre e confere. */
export async function testarCheckout(pastaId: string, _p: R | null, form: FormData): Promise<R & { final?: string; status?: number }> {
  const { pasta: p, student } = await pasta(pastaId);
  const rl = await rateLimit(`checkout:${student.id}`, 20, 3600);
  if (!rl.ok) return { erro: "Muitos testes seguidos. Espere um pouco." };
  const url = String(form.get("url") ?? "").trim();
  const r = await fetchSeguro(url);
  const ok = r.ok && r.status < 400;
  await salvarDados(p.id, { checkout: { url, ok, final: r.ok ? r.final : null, status: r.ok ? r.status : null, testadoEm: new Date().toISOString(), erro: r.ok ? null : r.erro } });
  reval();
  if (!r.ok) return { erro: r.erro };
  return ok ? { ok: true, final: r.final, status: r.status } : { erro: `O link respondeu ${r.status}. Confira se copiou o link certo do checkout.` };
}

// ---------- Caminho A · afiliada do SDM ----------

/** A3 · adaptar uma peça do kit pro país dela (sem mudar a promessa) ou pedir variação. */
export async function adaptarPeca(pastaId: string, pecaId: string, variacao: boolean): Promise<R> {
  const { pasta: p, student } = await pasta(pastaId);
  const peca = await db().query.kitPieces.findFirst({ where: and(eq(schema.kitPieces.id, z.string().uuid().parse(pecaId)), eq(schema.kitPieces.ativo, true)) });
  if (!peca?.texto) return { erro: "Essa peça não tem texto pra adaptar." };
  try {
    const idioma = await idiomaDaPasta(p.paisVenda);
    const r = await rodar("adaptar", { idioma_venda: idioma, pais_venda: p.paisVenda, peca: { tipo: peca.tipo, titulo: peca.titulo, texto: peca.texto }, variacao }, { studentId: student.id, semCache: variacao });
    await db().insert(schema.generatedItems).values({
      studentProductId: p.id,
      studentId: student.id,
      tipo: "texto_anuncio",
      idioma,
      conteudo: { peca: peca.id, titulo: peca.titulo, texto: r.saida.texto, variacao },
      porQueFunciona: r.saida.por_que_funciona,
      checagem: r.saida.checagem,
      agente: "AGT-anuncios",
      custoUsd: "0",
    });
    reval();
    return { ok: true };
  } catch (e) {
    log("error", "adaptar peça", { err: errMsg(e) });
    return { erro: erroIa(e) };
  }
}

// ---------- Números (pago e orgânico) ----------

const numSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gasto: z.string().optional(),
  cpm: z.string().optional(),
  ctr: z.string().optional(),
  cpc: z.string().optional(),
  vendas: z.string().optional(),
  views: z.string().optional(),
  seguidores: z.string().optional(),
  comentarios: z.string().optional(),
});
const num = (v?: string) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return v && Number.isFinite(n) && n >= 0 ? n : null;
};

export async function salvarNumeros(pastaId: string, _p: R | null, form: FormData): Promise<R> {
  const { pasta: p } = await pasta(pastaId);
  const f = numSchema.safeParse(Object.fromEntries(form));
  if (!f.success) return { erro: "Confira a data e os números." };
  const v = f.data;
  await db().insert(schema.metricsEntries).values({
    studentProductId: p.id,
    data: v.data,
    fonte: "manual",
    gasto: num(v.gasto)?.toString(),
    cpm: num(v.cpm)?.toString(),
    ctr: num(v.ctr)?.toString(),
    cpc: num(v.cpc)?.toString(),
    vendas: num(v.vendas) ?? undefined,
    views: num(v.views) ?? undefined,
    seguidores: num(v.seguidores) ?? undefined,
    comentarios: num(v.comentarios) ?? undefined,
  });
  reval();
  return { ok: true };
}
