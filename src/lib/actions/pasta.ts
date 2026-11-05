"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import * as gen from "@/lib/gen/modelo";
import { log, errMsg } from "@/lib/server/log";
import { baseDaPasta, getPasta, paises } from "@/lib/server/pasta";
import { erroIa, iaLigada, IaDesligada, IaLimite, rodar } from "@/lib/ai/run";
import { rateLimit } from "@/lib/server/rate-limit";
import { fetchSeguro } from "@/lib/server/safe-fetch";
import { apagarArquivo, salvarArquivo } from "@/lib/server/storage";
import { gerarImagemIA, iaConfigurada } from "@/lib/gen/ia";

type Tipo = "kit" | "anuncio" | "gancho" | "roteiro" | "bio";
// Revalida o app inteiro: a pasta aparece em V01, V05, V09 e no Início.
const reval = () => revalidatePath("/app", "layout");

/** V02 → cria a pasta do produto (ou abre a que já existe) e leva pro painel V05. */
export async function criarPasta(vitrineId: string) {
  const { student } = await requireStudent();
  const vid = z.string().uuid().parse(vitrineId);
  const vit = await db().query.vitrineProducts.findFirst({ where: and(eq(schema.vitrineProducts.id, vid), eq(schema.vitrineProducts.ativo, true)) });
  if (!vit) throw new Error("produto não encontrado");
  const existente = await db().query.studentProducts.findFirst({
    where: and(eq(schema.studentProducts.studentId, student.id), eq(schema.studentProducts.vitrineProductId, vid)),
  });
  let id = existente?.id;
  if (!id) {
    const [p] = await db()
      .insert(schema.studentProducts)
      .values({ studentId: student.id, vitrineProductId: vid, bioCode: randomBytes(5).toString("base64url").toLowerCase() })
      .returning({ id: schema.studentProducts.id });
    id = p!.id;
  }
  await db().update(schema.students).set({ produtoAtivo: id }).where(eq(schema.students.id, student.id));
  reval();
  redirect(`/app/v05/${id}`);
}

/** V07 · confirma o país de venda. Trocar depois marca o que já foi gerado pra refazer. */
export async function escolherPais(pastaId: string, k: string) {
  const { pasta } = await getPasta(pastaId);
  const lista = await paises();
  if (!lista.some((p) => p.k === k)) throw new Error("país inválido");
  const trocou = pasta.paisVenda && pasta.paisVenda !== k;
  await db()
    .update(schema.studentProducts)
    .set({ paisVenda: k, paisConfirmado: true, ...(trocou ? { precisaRefazer: true } : {}) })
    .where(eq(schema.studentProducts.id, pasta.id));
  reval();
  redirect(`/app/v05/${pasta.id}`);
}

export type LinkTeste = { ok: boolean; testadoEm: string; final?: string; dominio?: string; status?: number; saltos?: number; erro?: string; checks: { l: string; ok: boolean | null }[] };

/** V08 · testa o link de afiliada de verdade (servidor, seguindo redirecionamentos, sem IP interno). */
export async function testarLink(pastaId: string, _p: LinkTeste | null, form: FormData): Promise<LinkTeste> {
  const { pasta, vit, student } = await getPasta(pastaId);
  const url = String(form.get("link") ?? "").trim();
  const rl = await rateLimit(`link:${student.id}`, 20, 3600);
  if (!rl.ok) return { ok: false, testadoEm: new Date().toISOString(), erro: "Muitos testes seguidos. Espere um pouco.", checks: [] };
  const r = await fetchSeguro(url);
  const agora = new Date().toISOString();
  let res: LinkTeste;
  if (!r.ok) {
    res = { ok: false, testadoEm: agora, erro: r.erro, saltos: r.saltos.length, checks: [{ l: "O link abre", ok: false }] };
  } else {
    const dominio = new URL(r.final).hostname;
    const abre = r.status < 400;
    const redes = vit?.dominiosRede ?? [];
    const daRede = redes.length ? redes.some((d) => dominio === d || dominio.endsWith(`.${d}`)) || r.saltos.some((s) => redes.some((d) => new URL(s.url).hostname.endsWith(d))) : null;
    res = {
      ok: abre && daRede !== false,
      testadoEm: agora,
      final: r.final,
      dominio,
      status: r.status,
      saltos: r.saltos.length,
      checks: [
        { l: abre ? `O link abre (resposta ${r.status})` : `O link não abriu (resposta ${r.status})`, ok: abre },
        { l: `Chega em ${dominio}${r.saltos.length > 1 ? ` depois de ${r.saltos.length - 1} redirecionamento(s)` : ""}`, ok: abre },
        { l: daRede === null ? "Domínio da rede de afiliação: [rede a definir no admin]" : daRede ? "Passa pela rede de afiliação" : "Não passa pela rede de afiliação do produto", ok: daRede },
      ],
    };
  }
  await db().update(schema.studentProducts).set({ linkAfiliada: url, linkTeste: res }).where(eq(schema.studentProducts.id, pasta.id));
  reval();
  return res;
}

/** F02 · escolhe o funil e já gera o kit (pré-venda ou quiz). */
export async function escolherFunil(pastaId: string, funil: string) {
  const f = z.enum(["pre", "quiz", "direto"]).parse(funil);
  const { pasta } = await getPasta(pastaId);
  await db().update(schema.studentProducts).set({ funil: f }).where(eq(schema.studentProducts.id, pasta.id));
  if (f !== "direto") await gerarItens(pasta.id, "kit");
  reval();
  redirect(`/app/f04/${pasta.id}`);
}

/**
 * Gera (ou refaz) um tipo de conteúdo pra pasta. Com a IA ligada usa os agentes
 * (AGT-montador/anuncios/roteiros); sem IA usa o motor modelo SDM. Sempre salva
 * uma versão nova; nada vai pro ar sem aprovar.
 */
export async function gerarItens(pastaId: string, tipo: Tipo) {
  const c = await getPasta(pastaId);
  const { pasta, student } = c;
  const base = await baseDaPasta(c);
  if (!base) throw new Error(pasta.tipo === "sdm" ? "O time ainda não cadastrou a ficha do SDM. Use as peças prontas do kit." : "Complete a ficha do produto antes (etapa Ficha).");
  const rl = await rateLimit(`gen:${student.id}`, 60, 3600);
  if (!rl.ok) throw new Error("Muitas gerações seguidas. Espere um pouco.");
  const idioma = base.lang;
  const ia = await iaLigada("text_cheap");
  const versao = Number(
    (await db().select({ n: sql<number>`coalesce(max(versao),0)::int` }).from(schema.generatedItems).where(eq(schema.generatedItems.studentProductId, pasta.id)))[0]?.n ?? 0,
  ) + 1;
  const comum = { studentProductId: pasta.id, studentId: student.id, idioma, versao, custoUsd: "0", hashEntrada: createHash("sha256").update(`${pasta.id}:${idioma}:${tipo}:${versao}`).digest("hex") };
  const ficha = (pasta.dados as { ficha?: unknown }).ficha ?? { nome: base.nome, publico: base.quem, dor: base.dor, o_que_e: base.oque, promessa: base.prom, ganchos: base.hooks };
  const entrada = { idioma_venda: idioma, pais_venda: pasta.paisVenda, ficha };
  const rows: (typeof schema.generatedItems.$inferInsert)[] = [];
  const modelo = { agente: "modelo-sdm", checagem: { sem_cara_de_ia: true, sem_prova_inventada: true, regras_da_rede: true, regras_sdm: true } };

  if (tipo === "kit") {
    if (ia) {
      const r = await rodar("pagina", { ...entrada, formato: pasta.funil === "quiz" ? "quiz" : "pre" }, { studentId: student.id, semCache: true });
      rows.push({ ...comum, tipo: pasta.funil === "quiz" ? "kit_quiz" : "kit_pre", agente: r.agente, conteudo: { formato: pasta.funil ?? "pre", blocos: r.saida.blocos.map((b) => ({ n: b.n, oq: b.porque, x: b.x, pt: b.pt })), imagemPrompt: r.saida.prompt_imagem }, porQueFunciona: r.saida.por_que_funciona, checagem: r.saida.checagem, custoUsd: r.custoUsd.toFixed(6) });
    } else if (pasta.funil === "quiz") {
      const q = gen.kitQuiz(base);
      rows.push({ ...comum, ...modelo, tipo: "kit_quiz", conteudo: { blocos: q.blocos, quiz: q.quiz, resultado: q.resultado, imagemPrompt: base.img }, porQueFunciona: gen.PORQUE.kit_quiz });
    } else {
      rows.push({ ...comum, ...modelo, tipo: "kit_pre", conteudo: { blocos: gen.kitPre(base), imagemPrompt: base.img }, porQueFunciona: gen.PORQUE.kit_pre });
    }
  } else if (tipo === "anuncio") {
    const ja = await db().select({ c: schema.generatedItems.conteudo }).from(schema.generatedItems).where(and(eq(schema.generatedItems.studentProductId, pasta.id), eq(schema.generatedItems.tipo, "anuncio")));
    if (ia) {
      const evitar = ja.map((x) => (x.c as gen.Anuncio).gancho?.x).filter(Boolean).slice(-12);
      const r = await rodar("anuncios", { ...entrada, evitar }, { studentId: student.id, semCache: true });
      r.saida.anuncios.slice(0, 3).forEach((a, k) => rows.push({ ...comum, tipo: "anuncio", agente: r.agente, conteudo: { ...a, cor: (ja.length + k) % 4 }, porQueFunciona: r.saida.por_que_funciona, checagem: r.saida.checagem, custoUsd: k === 0 ? r.custoUsd.toFixed(6) : "0" }));
    } else {
      for (const a of gen.anuncios(base, ja.length % 10)) rows.push({ ...comum, ...modelo, tipo: "anuncio", conteudo: a, porQueFunciona: gen.PORQUE.anuncio });
    }
  } else if (tipo === "gancho") {
    if (ia) {
      const r = await rodar("ganchos", entrada, { studentId: student.id, semCache: true });
      rows.push({ ...comum, tipo: "gancho", agente: r.agente, conteudo: { ganchos: r.saida.ganchos }, porQueFunciona: r.saida.por_que_funciona, checagem: r.saida.checagem, custoUsd: r.custoUsd.toFixed(6) });
    } else rows.push({ ...comum, ...modelo, tipo: "gancho", conteudo: { ganchos: gen.ganchos(base) }, porQueFunciona: gen.PORQUE.gancho });
  } else if (tipo === "roteiro") {
    if (ia) {
      const r = await rodar("roteiros", entrada, { studentId: student.id, semCache: true });
      rows.push({ ...comum, tipo: "roteiro", agente: r.agente, conteudo: { roteiros: r.saida.roteiros.map((x) => ({ ...x, formato: `${x.tipo} · ${x.formato}` })) }, porQueFunciona: r.saida.por_que_funciona, checagem: r.saida.checagem, custoUsd: r.custoUsd.toFixed(6) });
    } else rows.push({ ...comum, ...modelo, tipo: "roteiro", conteudo: { roteiros: gen.roteiros(base, pasta.formatos) }, porQueFunciona: gen.PORQUE.roteiro });
  } else if (tipo === "bio") {
    if (ia) {
      const r = await rodar("bio", entrada, { studentId: student.id, semCache: true });
      rows.push({ ...comum, tipo: "bio", agente: r.agente, conteudo: r.saida, porQueFunciona: r.saida.por_que_funciona, checagem: r.saida.checagem, custoUsd: r.custoUsd.toFixed(6) });
    } else rows.push({ ...comum, ...modelo, tipo: "bio", conteudo: gen.bioLegenda(base), porQueFunciona: gen.PORQUE.bio });
  }
  await db().insert(schema.generatedItems).values(rows);
  if (pasta.precisaRefazer && tipo === "kit") await db().update(schema.studentProducts).set({ precisaRefazer: false }).where(eq(schema.studentProducts.id, pasta.id));
  reval();
  return { ok: true, n: rows.length };
}

export async function gerarAction(pastaId: string, tipo: Tipo) {
  try {
    return await gerarItens(pastaId, tipo);
  } catch (e) {
    if (e instanceof IaDesligada || e instanceof IaLimite) return { ok: false, erro: erroIa(e) };
    log("error", "gerar itens", { tipo, err: errMsg(e) });
    return { ok: false, erro: e instanceof Error && !/fetch|timeout|ECONN|status/i.test(e.message) ? e.message : erroIa(e) };
  }
}

async function itemDaAluna(itemId: string) {
  const { student } = await requireStudent();
  const id = z.string().uuid().parse(itemId);
  const item = await db().query.generatedItems.findFirst({ where: and(eq(schema.generatedItems.id, id), eq(schema.generatedItems.studentId, student.id)) });
  if (!item) throw new Error("item não encontrado");
  return item;
}

/** Aprovar / voltar pra rascunho. A IA (e o app) não publica nada sem a aluna aprovar. */
export async function statusItem(itemId: string, status: "aprovado" | "rascunho") {
  const item = await itemDaAluna(itemId);
  await db().update(schema.generatedItems).set({ status }).where(eq(schema.generatedItems.id, item.id));
  reval();
}

export async function excluirItem(itemId: string) {
  const item = await itemDaAluna(itemId);
  await db().delete(schema.generatedItems).where(eq(schema.generatedItems.id, item.id));
  reval();
}

/** Editar o texto de um anúncio (idioma de venda). */
export async function editarAnuncio(itemId: string, _p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const item = await itemDaAluna(itemId);
  if (item.tipo !== "anuncio") return { erro: "Só anúncio pode ser editado aqui." };
  const g = z.string().trim().min(3).max(300).safeParse(form.get("gancho"));
  const t = z.string().trim().min(3).max(2000).safeParse(form.get("texto"));
  const cor = z.coerce.number().int().min(0).max(3).safeParse(form.get("cor"));
  if (!g.success || !t.success) return { erro: "Escreva o gancho e o texto." };
  const c = item.conteudo as gen.Anuncio;
  const novo: gen.Anuncio = { ...c, gancho: { ...c.gancho, x: g.data }, texto: { ...c.texto, x: t.data }, cor: cor.success ? cor.data : c.cor };
  await db().update(schema.generatedItems).set({ conteudo: novo, status: "rascunho" }).where(eq(schema.generatedItems.id, item.id));
  reval();
  return { ok: true };
}

/** V06 · cartão "esse produto ajuda quem…" (aula 3.7). */
export async function salvarCartao(pastaId: string, _p: { ok?: boolean } | null, form: FormData) {
  const { pasta } = await getPasta(pastaId);
  const txt = z.string().trim().max(500).parse(form.get("cartao") ?? "");
  await db().update(schema.studentProducts).set({ cartaoAjudaQuem: txt }).where(eq(schema.studentProducts.id, pasta.id));
  reval();
  return { ok: true };
}

const TIPOS_IMG: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Enviar uma imagem (foto dela, print, arte) pra usar nos criativos. */
export async function enviarImagem(pastaId: string, _p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const { pasta, student } = await getPasta(pastaId);
  const f = form.get("arquivo");
  if (!(f instanceof File) || f.size === 0) return { erro: "Escolha uma imagem." };
  const ext = TIPOS_IMG[f.type];
  if (!ext) return { erro: "Use PNG, JPG ou WebP." };
  if (f.size > 4 * 1024 * 1024) return { erro: "Imagem maior que 4 MB. Reduza e tente de novo." };
  const proporcao = z.enum(["1:1", "4:5", "9:16"]).catch("1:1").parse(form.get("proporcao"));
  const buf = await f.arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(buf)).digest("hex");
  const path = `alunas/${student.id}/${pasta.id}/${randomUUID()}.${ext}`;
  try {
    await salvarArquivo(path, buf, f.type);
  } catch (e) {
    log("error", "upload falhou", { err: errMsg(e) });
    return { erro: "Não deu pra salvar a imagem agora." };
  }
  await db().insert(schema.images).values({ studentId: student.id, studentProductId: pasta.id, prompt: "[enviada pela aluna]", proporcao, qualidade: "original", storagePath: path, hash, custo: "0" });
  reval();
  return { ok: true };
}

/** Gerar imagem com IA (precisa da chave da OpenAI e do modelo no AD11). */
export async function gerarImagem(pastaId: string, _p: { ok?: boolean; erro?: string } | null, form: FormData) {
  const { pasta, student } = await getPasta(pastaId);
  if (!(await iaConfigurada("image"))) return { erro: "A geração de imagem com IA ainda não está ligada (falta a chave da OpenAI). Copie o prompt e use outra ferramenta, ou envie sua imagem." };
  const prompt = z.string().trim().min(10).max(1500).safeParse(form.get("prompt"));
  if (!prompt.success) return { erro: "Escreva o prompt da imagem." };
  const proporcao = z.enum(["1:1", "4:5", "9:16"]).catch("1:1").parse(form.get("proporcao"));
  const rl = await rateLimit(`img:${student.id}`, 10, 86400);
  if (!rl.ok) return { erro: "Você chegou no limite de imagens de hoje. Amanhã libera de novo." };
  try {
    const r = await gerarImagemIA(prompt.data, proporcao, student.id);
    const path = `alunas/${student.id}/${pasta.id}/${randomUUID()}.png`;
    await salvarArquivo(path, r.png, "image/png");
    await db().insert(schema.images).values({ studentId: student.id, studentProductId: pasta.id, prompt: prompt.data, proporcao, qualidade: r.qualidade, storagePath: path, hash: createHash("sha256").update(prompt.data + proporcao).digest("hex"), custo: String(r.custo) });
  } catch (e) {
    log("error", "imagem IA falhou", { err: errMsg(e) });
    return { erro: "Não deu pra gerar a imagem agora. Tente de novo." };
  }
  reval();
  return { ok: true };
}

export async function excluirImagem(imageId: string) {
  const { student } = await requireStudent();
  const id = z.string().uuid().parse(imageId);
  const img = await db().query.images.findFirst({ where: and(eq(schema.images.id, id), eq(schema.images.studentId, student.id)) });
  if (!img) return;
  if (img.storagePath) await apagarArquivo(img.storagePath).catch(() => {});
  await db().delete(schema.images).where(eq(schema.images.id, img.id));
  reval();
}
