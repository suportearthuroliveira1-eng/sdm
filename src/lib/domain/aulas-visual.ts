import { z } from "zod";
import { PRODUCTS } from "./entitlements";

/** Capas e banners das aulas e trilhas (Admin → Aulas). Fica no setting `aulas_visual` (sem migration). */
export const AULAS_VISUAL_KEY = "aulas_visual";

export const ID_TRILHA_RE = /^[A-Za-z0-9.-]{1,12}$/;
export const ID_AULA_RE = /^[A-Za-z0-9.-]{1,16}$/;

export const trilhaIdSchema = z.string().trim().regex(ID_TRILHA_RE, "Use até 12 letras, números, ponto ou hífen (ex.: M7).");
export const aulaIdSchema = z.string().trim().regex(ID_AULA_RE, "Use até 16 letras, números, ponto ou hífen (ex.: 7.1).");

/** Só imagem enviada pelo admin (/api/publico/...) ou https. Nada de javascript:, data: etc. */
export const imagemUrlSchema = z
  .string()
  .max(400)
  .regex(/^(\/api\/publico\/[A-Za-z0-9._/-]+|https:\/\/[^\s"'<>]+)$/, "Endereço de imagem inválido.");
export const corSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor #RRGGBB.");

export const visualTrilhaSchema = z.object({ capa: imagemUrlSchema.optional(), banner: imagemUrlSchema.optional(), cor: corSchema.optional() });
export const visualAulaSchema = z.object({ capa: imagemUrlSchema.optional() });

export const aulasVisualSchema = z.object({
  modulos: z.record(z.string().regex(ID_TRILHA_RE), visualTrilhaSchema).default({}),
  aulas: z.record(z.string().regex(ID_AULA_RE), visualAulaSchema).default({}),
});
export type AulasVisual = z.infer<typeof aulasVisualSchema>;
export const AULAS_VISUAL_VAZIO: AulasVisual = { modulos: {}, aulas: {} };

/** Lê o valor salvo com tolerância: o que não valida vira vazio (o app nunca quebra por causa de capa). */
export function lerAulasVisual(valor: unknown): AulasVisual {
  const r = aulasVisualSchema.safeParse(valor ?? {});
  return r.success ? r.data : AULAS_VISUAL_VAZIO;
}

export type TipoImagem = "aula-capa" | "trilha-capa" | "trilha-banner";
export const TIPOS_IMAGEM: TipoImagem[] = ["aula-capa", "trilha-capa", "trilha-banner"];

/** Devolve um novo visual com a imagem trocada (url) ou removida (null). Não muda o original. */
export function aplicarImagem(v: AulasVisual, tipo: TipoImagem, id: string, url: string | null): AulasVisual {
  const out: AulasVisual = { modulos: { ...v.modulos }, aulas: { ...v.aulas } };
  if (tipo === "aula-capa") {
    const atual = { ...(out.aulas[id] ?? {}) };
    if (url) atual.capa = url;
    else delete atual.capa;
    if (Object.keys(atual).length) out.aulas[id] = atual;
    else delete out.aulas[id];
    return out;
  }
  const campo = tipo === "trilha-capa" ? "capa" : "banner";
  const atual = { ...(out.modulos[id] ?? {}) };
  if (url) atual[campo] = url;
  else delete atual[campo];
  if (Object.keys(atual).length) out.modulos[id] = atual;
  else delete out.modulos[id];
  return out;
}

/** Cor da trilha (ou remove com null). */
export function aplicarCor(v: AulasVisual, id: string, cor: string | null): AulasVisual {
  const out: AulasVisual = { modulos: { ...v.modulos }, aulas: { ...v.aulas } };
  const atual = { ...(out.modulos[id] ?? {}) };
  if (cor) atual.cor = cor;
  else delete atual.cor;
  if (Object.keys(atual).length) out.modulos[id] = atual;
  else delete out.modulos[id];
  return out;
}

/** Tira do visual tudo de uma aula/trilha apagada. */
export function limparVisual(v: AulasVisual, tipo: "aula" | "trilha", id: string): AulasVisual {
  const out: AulasVisual = { modulos: { ...v.modulos }, aulas: { ...v.aulas } };
  if (tipo === "aula") delete out.aulas[id];
  else delete out.modulos[id];
  return out;
}

/** Imagem do topo da aula: capa da aula, senão banner da trilha, senão capa da trilha. */
export function imagemDaAula(v: AulasVisual, aulaId: string, moduloId: string): string | null {
  return v.aulas[aulaId]?.capa ?? v.modulos[moduloId]?.banner ?? v.modulos[moduloId]?.capa ?? null;
}

const vazioVira = (s: unknown) => (typeof s === "string" && s.trim() === "" ? undefined : s);
const textoOpc = (max: number) => z.preprocess(vazioVira, z.string().trim().max(max).optional());

export const REGRAS_LIBERACAO = ["compra", "trilha_pago", "trilha_org", "primeira_venda"] as const;
export const REGRA_LABEL: Record<(typeof REGRAS_LIBERACAO)[number], string> = {
  compra: "Libera com a compra",
  trilha_pago: "Libera na trilha de tráfego pago",
  trilha_org: "Libera na trilha orgânica",
  primeira_venda: "Libera depois da 1ª venda",
};

export const trilhaInputSchema = z.object({
  id: trilhaIdSchema,
  nome: z.string().trim().min(1, "Dê um nome à trilha.").max(120),
  parte: textoOpc(80),
  objetivo: textoOpc(2000),
  regraLiberacao: z.enum(REGRAS_LIBERACAO),
  ordem: z.preprocess(vazioVira, z.coerce.number().int().min(0).max(99999).optional()),
  cor: z.preprocess(vazioVira, corSchema.optional()),
});
export type TrilhaInput = z.infer<typeof trilhaInputSchema>;

export const aulaInputSchema = z.object({
  id: aulaIdSchema,
  moduleId: trilhaIdSchema,
  titulo: z.string().trim().min(1, "Dê um título à aula.").max(200),
  tipo: textoOpc(60),
  minutos: z.preprocess(vazioVira, z.coerce.number().int().min(0).max(600).optional()),
  objetivo: textoOpc(2000),
  agoraFacaTexto: textoOpc(1000),
  agoraFacaAlvo: textoOpc(60),
  videoUrl: z.preprocess(vazioVira, z.string().trim().max(500).url("Link do vídeo inválido.").refine((u) => /^https:\/\//.test(u), "Use um link https.").optional()),
  requerEntitlements: z.array(z.enum(PRODUCTS)).max(PRODUCTS.length).default([]),
  ordem: z.preprocess(vazioVira, z.coerce.number().int().min(0).max(99999).optional()),
  publicada: z.boolean(),
  regravar: z.boolean().default(false),
});
export type AulaInput = z.infer<typeof aulaInputSchema>;
