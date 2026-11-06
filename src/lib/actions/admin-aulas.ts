"use server";

import { and, asc, eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import {
  AULAS_VISUAL_KEY,
  aplicarCor,
  aplicarImagem,
  aulaIdSchema,
  aulaInputSchema,
  lerAulasVisual,
  limparVisual,
  TIPOS_IMAGEM,
  trilhaIdSchema,
  trilhaInputSchema,
  type AulasVisual,
  type TipoImagem,
} from "@/lib/domain/aulas-visual";
import { PRODUCTS } from "@/lib/domain/entitlements";
import { audit } from "@/lib/server/audit";
import { salvarImagemPublica } from "@/lib/server/imagens";
import { getSetting } from "@/lib/server/settings";

export type AulasState = { ok?: boolean; erro?: string; msg?: string; url?: string | null } | null;

function primeiroErro(e: z.ZodError) {
  const i = e.issues[0];
  return i?.message ?? "Dados inválidos.";
}

function revalidar() {
  revalidatePath("/admin/aulas", "layout");
  revalidatePath("/app", "layout");
}

async function lerVisual(): Promise<AulasVisual> {
  return lerAulasVisual(await getSetting<unknown>(AULAS_VISUAL_KEY, null));
}

async function gravarVisual(v: AulasVisual) {
  await db()
    .insert(schema.settings)
    .values({ key: AULAS_VISUAL_KEY, value: v, grupo: "personalizar", descricao: "Capas e banners das aulas e trilhas (Admin → Aulas).", pendente: false })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: v, pendente: false } });
}

const txt = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
};

/** Cria (modo=criar) ou atualiza uma trilha. Ao criar, abre a tela de edição pra subir capa e banner. */
export async function salvarTrilha(_prev: AulasState, fd: FormData): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const criar = txt(fd, "modo") === "criar";
  const r = trilhaInputSchema.safeParse({
    id: txt(fd, "id"),
    nome: txt(fd, "nome"),
    parte: txt(fd, "parte"),
    objetivo: txt(fd, "objetivo"),
    regraLiberacao: txt(fd, "regraLiberacao") ?? "compra",
    ordem: txt(fd, "ordem"),
    cor: txt(fd, "cor"),
  });
  if (!r.success) return { erro: primeiroErro(r.error) };
  const d = r.data;
  const old = await db().query.modules.findFirst({ where: eq(schema.modules.id, d.id) });
  if (criar && old) return { erro: `Já existe uma trilha com o código ${d.id}. Escolha outro.` };
  if (!criar && !old) return { erro: "Trilha não encontrada." };

  let ordem = d.ordem;
  if (ordem === undefined) {
    if (old) ordem = old.ordem;
    else {
      const [m] = await db().select({ m: max(schema.modules.ordem) }).from(schema.modules);
      ordem = (m?.m ?? 0) + 1;
    }
  }
  const valores = { nome: d.nome, parte: d.parte ?? null, objetivo: d.objetivo ?? null, regraLiberacao: d.regraLiberacao, ordem };
  if (criar) await db().insert(schema.modules).values({ id: d.id, ...valores });
  else await db().update(schema.modules).set(valores).where(eq(schema.modules.id, d.id));

  const v = await lerVisual();
  const corAtual = v.modulos[d.id]?.cor;
  if ((d.cor ?? undefined) !== corAtual) await gravarVisual(aplicarCor(v, d.id, d.cor ?? null));

  await audit(admin.id, criar ? "trilha.criar" : "trilha.salvar", { tipo: "trilha", id: d.id }, { de: old ?? null, para: { ...valores, cor: d.cor ?? null } });
  revalidar();
  if (criar) redirect(`/admin/aulas/trilha/${encodeURIComponent(d.id)}?criada=1`);
  return { ok: true, msg: "Trilha salva." };
}

/** Apaga uma trilha vazia (sem nenhuma aula). */
export async function apagarTrilha(id: string): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const p = trilhaIdSchema.safeParse(id);
  if (!p.success) return { erro: "Código inválido." };
  const old = await db().query.modules.findFirst({ where: eq(schema.modules.id, p.data) });
  if (!old) return { erro: "Trilha não encontrada." };
  const [c] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.lessons).where(eq(schema.lessons.moduleId, p.data));
  if ((c?.n ?? 0) > 0) return { erro: `A trilha tem ${c?.n} aula(s). Mova ou apague as aulas antes.` };
  await db().delete(schema.modules).where(eq(schema.modules.id, p.data));
  await gravarVisual(limparVisual(await lerVisual(), "trilha", p.data));
  await audit(admin.id, "trilha.apagar", { tipo: "trilha", id: p.data }, { de: old });
  revalidar();
  return { ok: true, msg: "Trilha apagada." };
}

/** Cria (modo=criar) ou atualiza uma aula. Trocar a trilha = mudar moduleId. */
export async function salvarAula(_prev: AulasState, fd: FormData): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const criar = txt(fd, "modo") === "criar";
  const r = aulaInputSchema.safeParse({
    id: txt(fd, "id"),
    moduleId: txt(fd, "moduleId"),
    titulo: txt(fd, "titulo"),
    tipo: txt(fd, "tipo"),
    minutos: txt(fd, "minutos"),
    objetivo: txt(fd, "objetivo"),
    agoraFacaTexto: txt(fd, "agoraFacaTexto"),
    agoraFacaAlvo: txt(fd, "agoraFacaAlvo"),
    videoUrl: txt(fd, "videoUrl"),
    requerEntitlements: PRODUCTS.filter((p) => fd.get(`req_${p}`) === "on"),
    ordem: txt(fd, "ordem"),
    publicada: fd.get("publicada") === "on",
    regravar: fd.get("regravar") === "on",
  });
  if (!r.success) return { erro: primeiroErro(r.error) };
  const d = r.data;
  const [old, mod] = await Promise.all([
    db().query.lessons.findFirst({ where: eq(schema.lessons.id, d.id) }),
    db().query.modules.findFirst({ where: eq(schema.modules.id, d.moduleId) }),
  ]);
  if (!mod) return { erro: "Escolha uma trilha que exista." };
  if (criar && old) return { erro: `Já existe uma aula com o código ${d.id}. Escolha outro.` };
  if (!criar && !old) return { erro: "Aula não encontrada." };

  let ordem = d.ordem;
  if (ordem === undefined) {
    if (old && old.moduleId === d.moduleId) ordem = old.ordem;
    else {
      const [m] = await db().select({ m: max(schema.lessons.ordem) }).from(schema.lessons).where(eq(schema.lessons.moduleId, d.moduleId));
      ordem = (m?.m ?? (mod.ordem ?? 0) * 100) + 1;
    }
  }
  const valores = {
    moduleId: d.moduleId,
    titulo: d.titulo,
    tipo: d.tipo ?? null,
    minutos: d.minutos ?? null,
    objetivo: d.objetivo ?? null,
    agoraFacaTexto: d.agoraFacaTexto ?? null,
    agoraFacaAlvo: d.agoraFacaAlvo ?? null,
    videoUrl: d.videoUrl ?? null,
    requerEntitlements: d.requerEntitlements,
    ordem,
    publicada: d.publicada,
    regravar: d.regravar,
  };
  if (criar) await db().insert(schema.lessons).values({ id: d.id, ...valores });
  else await db().update(schema.lessons).set(valores).where(eq(schema.lessons.id, d.id));

  const acao = criar ? "aula.criar" : old && old.moduleId !== d.moduleId ? "aula.mover_trilha" : "aula.salvar";
  await audit(admin.id, acao, { tipo: "aula", id: d.id }, { de: old ?? null, para: valores });
  revalidar();
  if (criar) redirect(`/admin/aulas/aula/${encodeURIComponent(d.id)}?criada=1`);
  return { ok: true, msg: old && old.moduleId !== d.moduleId ? `Aula salva e movida pra ${mod.id}.` : "Aula salva." };
}

/** Apaga uma aula que não está publicada. */
export async function apagarAula(id: string): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const p = aulaIdSchema.safeParse(id);
  if (!p.success) return { erro: "Código inválido." };
  const old = await db().query.lessons.findFirst({ where: eq(schema.lessons.id, p.data) });
  if (!old) return { erro: "Aula não encontrada." };
  if (old.publicada) return { erro: "Aula publicada não pode ser apagada. Despublique antes." };
  try {
    await db().delete(schema.lessons).where(eq(schema.lessons.id, p.data));
  } catch {
    return { erro: "Não deu pra apagar: a aula ainda é usada em outro lugar. Despublique e deixe guardada." };
  }
  await gravarVisual(limparVisual(await lerVisual(), "aula", p.data));
  await audit(admin.id, "aula.apagar", { tipo: "aula", id: p.data }, { de: old });
  revalidar();
  return { ok: true, msg: "Aula apagada." };
}

/** Sobe ou desce a aula dentro da trilha (troca a ordem com a vizinha). */
export async function moverAula(id: string, direcao: "up" | "down"): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const p = aulaIdSchema.safeParse(id);
  if (!p.success || (direcao !== "up" && direcao !== "down")) return { erro: "Pedido inválido." };
  const aula = await db().query.lessons.findFirst({ where: eq(schema.lessons.id, p.data) });
  if (!aula) return { erro: "Aula não encontrada." };
  const irmas = await db()
    .select({ id: schema.lessons.id, ordem: schema.lessons.ordem })
    .from(schema.lessons)
    .where(eq(schema.lessons.moduleId, aula.moduleId))
    .orderBy(asc(schema.lessons.ordem), asc(schema.lessons.id));
  const i = irmas.findIndex((a) => a.id === aula.id);
  const j = direcao === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= irmas.length) return { ok: true, msg: "Já está na ponta." };
  // Mantém os mesmos valores de ordem (só reparte), garantindo que fiquem crescentes.
  const ordens = irmas.map((a) => a.ordem);
  for (let k = 1; k < ordens.length; k++) if (ordens[k]! <= ordens[k - 1]!) ordens[k] = ordens[k - 1]! + 1;
  const nova = [...irmas];
  [nova[i], nova[j]] = [nova[j]!, nova[i]!];
  const mudar = nova.map((a, k) => ({ id: a.id, de: a.ordem, para: ordens[k]! })).filter((x) => x.de !== x.para);
  await db().transaction(async (tx) => {
    for (const m of mudar) await tx.update(schema.lessons).set({ ordem: m.para }).where(and(eq(schema.lessons.id, m.id), eq(schema.lessons.moduleId, aula.moduleId)));
  });
  await audit(admin.id, "aula.ordem", { tipo: "aula", id: aula.id }, { direcao, mudancas: mudar });
  revalidar();
  return { ok: true, msg: direcao === "up" ? "Aula subiu." : "Aula desceu." };
}

const tipoImagemSchema = z.enum(TIPOS_IMAGEM as [TipoImagem, ...TipoImagem[]]);

async function alvoExiste(tipo: TipoImagem, id: string) {
  if (tipo === "aula-capa") {
    const p = aulaIdSchema.safeParse(id);
    return p.success && Boolean(await db().query.lessons.findFirst({ where: eq(schema.lessons.id, p.data), columns: { id: true } }));
  }
  const p = trilhaIdSchema.safeParse(id);
  return p.success && Boolean(await db().query.modules.findFirst({ where: eq(schema.modules.id, p.data), columns: { id: true } }));
}

/** Sobe a imagem (campo "imagem" do FormData) e grava a URL no aulas_visual. */
export async function enviarImagem(tipo: TipoImagem, id: string, fd: FormData): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const t = tipoImagemSchema.safeParse(tipo);
  if (!t.success) return { erro: "Tipo de imagem inválido." };
  if (!(await alvoExiste(t.data, id))) return { erro: t.data === "aula-capa" ? "Aula não encontrada." : "Trilha não encontrada." };
  const arq = fd.get("imagem");
  const up = await salvarImagemPublica(t.data === "aula-capa" ? "aulas" : "modulos", arq instanceof File ? arq : null);
  if (!up.url) return { erro: up.erro ?? "Não deu pra salvar a imagem." };
  const v = await lerVisual();
  await gravarVisual(aplicarImagem(v, t.data, id, up.url));
  await audit(admin.id, t.data === "aula-capa" ? "aula.imagem" : "trilha.imagem", { tipo: t.data === "aula-capa" ? "aula" : "trilha", id }, { tipo: t.data, url: up.url });
  revalidar();
  return { ok: true, msg: "Imagem salva.", url: up.url };
}

/** Tira a imagem (o arquivo fica no storage; só some do app). */
export async function removerImagem(tipo: TipoImagem, id: string): Promise<AulasState> {
  const admin = await requireAdmin(["admin", "conteudo"]);
  const t = tipoImagemSchema.safeParse(tipo);
  const okId = t.success && (t.data === "aula-capa" ? aulaIdSchema : trilhaIdSchema).safeParse(id).success;
  if (!t.success || !okId) return { erro: "Pedido inválido." };
  const v = await lerVisual();
  await gravarVisual(aplicarImagem(v, t.data, id, null));
  await audit(admin.id, t.data === "aula-capa" ? "aula.imagem_remover" : "trilha.imagem_remover", { tipo: t.data === "aula-capa" ? "aula" : "trilha", id }, { tipo: t.data });
  revalidar();
  return { ok: true, msg: "Imagem removida.", url: null };
}
