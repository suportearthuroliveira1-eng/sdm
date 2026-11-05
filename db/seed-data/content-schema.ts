import { z } from "zod";

/**
 * Formato do conteúdo de seed (db/seed-data/conteudo.json).
 * Esse arquivo é gerado a partir de docs/SDM_contexto_completo_v6.md (seção 6:
 * 111 aulas + B1 + PO.1–PO.5; glossário: 32 oficiais + 7 do app) e de
 * docs/prototipo/*.dc.html (MODS, VIT, GLOSS, CKDEF, PASSOS, INFODEF...).
 * Nada aqui é inventado: sem o arquivo, o seed de conteúdo é pulado.
 */
const products = z.enum(["sdm", "up1", "d1", "up2", "d2"]);

export const moduleSeed = z.object({
  id: z.string(),
  nome: z.string(),
  parte: z.string().optional(),
  objetivo: z.string().optional(),
  regraLiberacao: z.enum(["compra", "trilha_pago", "trilha_org", "primeira_venda"]).default("compra"),
  materiais: z.array(z.unknown()).default([]),
  ordem: z.number().int(),
});

export const lessonSeed = z.object({
  id: z.string(),
  moduleId: z.string(),
  titulo: z.string(),
  tipo: z.string().optional(),
  minutos: z.number().int().optional(),
  objetivo: z.string().optional(),
  roteiro: z.array(z.unknown()).default([]),
  agoraFacaTexto: z.string().optional(),
  agoraFacaAlvo: z.string().optional(),
  videoUrl: z.string().optional(),
  materiais: z.array(z.unknown()).default([]),
  requerEntitlements: z.array(products).default([]),
  ordem: z.number().int(),
  publicada: z.boolean().default(true),
});

export const glossarySeed = z.object({ termo: z.string(), definicao: z.string(), oficial: z.boolean(), aula: z.string().optional() });

export const vitrineSeed = z.object({
  code: z.string().regex(/^VIT-\d{4}$/),
  nome: z.string(),
  produtor: z.string().optional(),
  redeAfiliacao: z.string().optional(),
  idioma: z.string().optional(),
  paises: z.array(z.string()).default([]),
  assunto: z.string().optional(),
  tipo: z.string().optional(),
  resumo: z.string().optional(),
  publico: z.string().optional(),
  dor: z.string().optional(),
  oQueE: z.string().optional(),
  promessa: z.string().optional(),
  ganchosBase: z.array(z.unknown()).default([]),
  promptImagem: z.string().optional(),
  tags: z.array(z.string()).default([]),
  seloOrg: z.boolean().default(false),
  seloAd: z.boolean().default(false),
  concorrencia: z.string().optional(),
  funilIndicado: z.enum(["pre", "quiz", "direto"]).optional(),
  comissaoTipo: z.enum(["pct", "fixo"]).optional(),
  comissaoValor: z.string().optional(),
  linkPaginaProdutor: z.string().optional(),
  extra: z.record(z.string(), z.unknown()).default({}),
  ordem: z.number().int().default(0),
});

export const contentBlockSeed = z.object({ key: z.string(), kind: z.string(), data: z.unknown() });

export const conteudoSeed = z.object({
  fonte: z.string(), // ex.: "contexto v6 + protótipo 2026-xx-xx"
  modules: z.array(moduleSeed),
  lessons: z.array(lessonSeed),
  glossary: z.array(glossarySeed),
  vitrine: z.array(vitrineSeed),
  contentBlocks: z.array(contentBlockSeed).default([]),
});
export type ConteudoSeed = z.infer<typeof conteudoSeed>;
