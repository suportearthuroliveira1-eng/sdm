/**
 * pnpm docs:conteudo — monta db/seed-data/conteudo.json a partir de
 * db/seed-data/prototipo-raw.json (gerado por pnpm docs:extract).
 * Só reorganiza o que está no protótipo; não cria texto nem número.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { conteudoSeed, type ConteudoSeed } from "../db/seed-data/content-schema";

type Bi = { x: string | string[]; pt: string | string[] };
type Raw = {
  MODS: { id: string; nome: string; parte: string; lib: string; obj: string; mat: string; a: string[] }[];
  AULAS: { id: string; t: string; tipo: string; min: string; af: string; alvo: string; mod: string; po: boolean }[];
  VIT: { id: string; nome: string; lang: string; assunto: string; aX: string; aPt: string; tipo: string; paises: string; selos: string[]; conc: string; funil: "pre" | "quiz" | "direto"; resumo: string; quem: Bi; dor: Bi; oque: Bi; prom: Bi; hooks: Bi; img: string; tags: string }[];
  GLOSS: [string, string, number?][];
  GLOSS_AULA: Record<string, string>;
  CKDEF: Record<string, unknown>;
  PASSOS: Record<string, unknown>;
  INFODEF: Record<string, unknown>;
  ENT: Record<string, unknown>;
  HEAD: Record<string, unknown>;
  DIAG: unknown[];
  PAISES: unknown[];
  LG: unknown;
  SCREENS: string[];
  TABS: string[];
};

const all = JSON.parse(readFileSync("db/seed-data/prototipo-raw.json", "utf8")) as Record<string, unknown>;
const raw = all["docs/prototipo/App.dc.html#0"] as Raw;
if (!raw?.MODS) throw new Error("rode pnpm docs:extract antes");

const LIB = { compra: "compra", pago: "trilha_pago", org: "trilha_org", venda: "primeira_venda" } as const;
const pt = (b: Bi) => (Array.isArray(b.pt) ? b.pt.join(" ") : b.pt);

const conteudo: ConteudoSeed = {
  fonte: "protótipo docs/prototipo/App.dc.html (roteiros de 5 blocos: pendentes, vêm do contexto v6)",
  modules: raw.MODS.map((m, i) => ({
    id: m.id,
    nome: m.nome,
    parte: m.parte,
    objetivo: m.obj,
    regraLiberacao: LIB[m.lib as keyof typeof LIB] ?? (() => { throw new Error(`lib desconhecida ${m.lib}`); })(),
    materiais: m.mat.split(" · ").map((t) => ({ titulo: t.trim() })),
    ordem: i,
  })),
  lessons: raw.AULAS.map((a, i) => ({
    id: a.id,
    moduleId: a.mod,
    titulo: a.t,
    tipo: a.tipo,
    minutos: /^\d+$/.test(a.min) ? Number(a.min) : undefined,
    roteiro: [],
    agoraFacaTexto: a.af,
    agoraFacaAlvo: a.alvo === "q" ? "pergunta" : a.alvo,
    materiais: [],
    requerEntitlements: a.po ? ["up1", "d1"] : [],
    ordem: i,
    publicada: true,
  })),
  glossary: raw.GLOSS.map(([termo, definicao, app]) => ({
    termo,
    definicao,
    oficial: !app,
    aula: raw.GLOSS_AULA[termo.toLowerCase()],
  })),
  vitrine: raw.VIT.map((v, i) => ({
    code: v.id,
    nome: v.nome,
    idioma: v.lang,
    paises: v.paises.split(/\s+e\s+|,\s*/).map((s) => s.trim()).filter(Boolean),
    assunto: v.assunto,
    tipo: v.tipo,
    resumo: v.resumo,
    publico: pt(v.quem),
    dor: pt(v.dor),
    oQueE: pt(v.oque),
    promessa: pt(v.prom),
    ganchosBase: Array.isArray(v.hooks.x) ? v.hooks.x : [v.hooks.x],
    promptImagem: v.img,
    tags: v.tags.split(/\s+/).filter(Boolean),
    seloOrg: v.selos.includes("org"),
    seloAd: v.selos.includes("ad"),
    concorrencia: v.conc,
    funilIndicado: v.funil,
    extra: { lang: v.lang, aX: v.aX, aPt: v.aPt, quem: v.quem, dor: v.dor, oque: v.oque, prom: v.prom, hooks: v.hooks },
    ordem: i,
  })),
  contentBlocks: [
    ...Object.entries(raw.CKDEF).map(([k, data]) => ({ key: `checklist.${k}`, kind: "checklist", data })),
    ...Object.entries(raw.PASSOS).map(([k, data]) => ({ key: `passos.${k}`, kind: "passos", data })),
    ...Object.entries(raw.INFODEF).map(([k, data]) => ({ key: `info.${k}`, kind: "info", data })),
    ...Object.entries(raw.ENT).map(([k, data]) => ({ key: `entenda.${k}`, kind: "entenda", data })),
    { key: "app.head", kind: "texto", data: raw.HEAD },
    { key: "app.diagnostico", kind: "diagnostico", data: raw.DIAG },
    { key: "app.paises", kind: "texto", data: raw.PAISES },
    { key: "app.lg", kind: "texto", data: raw.LG },
  ],
};

const parsed = conteudoSeed.parse(conteudo);
const reais = parsed.lessons.filter((l) => l.requerEntitlements.length === 0 && l.id !== "B1").length;
writeFileSync("db/seed-data/conteudo.json", JSON.stringify(parsed, null, 2) + "\n");
console.log(
  `conteudo.json: ${parsed.modules.length} módulos, ${parsed.lessons.length} aulas (${reais} da grade + B1 + ${parsed.lessons.length - reais - 1} PO), ` +
    `${parsed.glossary.length} termos (${parsed.glossary.filter((g) => g.oficial).length} oficiais), ${parsed.vitrine.length} produtos, ${parsed.contentBlocks.length} blocos`,
);
