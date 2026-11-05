import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conteudoSeed } from "../../db/seed-data/content-schema";

const c = conteudoSeed.parse(JSON.parse(readFileSync("db/seed-data/conteudo.json", "utf8")));
const raw = JSON.parse(readFileSync("db/seed-data/prototipo-raw.json", "utf8"))["docs/prototipo/App.dc.html#0"] as { SCREENS: string[] };

describe("conteúdo semeado do protótipo", () => {
  it("111 aulas da grade + B1 + PO.1 a PO.5", () => {
    const po = c.lessons.filter((l) => l.id.startsWith("PO."));
    const grade = c.lessons.filter((l) => !l.id.startsWith("PO.") && l.id !== "B1");
    expect(grade).toHaveLength(111);
    expect(po.map((l) => l.id)).toEqual(["PO.1", "PO.2", "PO.3", "PO.4", "PO.5"]);
    expect(c.lessons.some((l) => l.id === "B1")).toBe(true);
  });

  it("aulas PO liberam com UP1 ou D1; as outras só com a compra", () => {
    for (const l of c.lessons) expect(l.requerEntitlements).toEqual(l.id.startsWith("PO.") ? ["up1", "d1"] : []);
  });

  it("todo 'Agora faça' aponta pra uma tela do app, fora ou pergunta", () => {
    const telas = new Set([...raw.SCREENS, "fora", "pergunta"]);
    const ruins = c.lessons.filter((l) => !telas.has(l.agoraFacaAlvo ?? ""));
    expect(ruins.map((l) => `${l.id}->${l.agoraFacaAlvo}`)).toEqual([]);
  });

  it("toda aula está num módulo que existe, ids únicos", () => {
    const mods = new Set(c.modules.map((m) => m.id));
    expect(c.lessons.every((l) => mods.has(l.moduleId))).toBe(true);
    expect(new Set(c.lessons.map((l) => l.id)).size).toBe(c.lessons.length);
  });

  it("glossário: 32 oficiais + 7 do app", () => {
    expect(c.glossary.filter((g) => g.oficial)).toHaveLength(32);
    expect(c.glossary.filter((g) => !g.oficial)).toHaveLength(7);
  });

  it("vitrine: 6 produtos com selos e funil", () => {
    expect(c.vitrine).toHaveLength(6);
    expect(c.vitrine.every((v) => v.funilIndicado && (v.seloOrg || v.seloAd))).toBe(true);
    expect(c.vitrine.every((v) => v.comissaoValor === undefined)).toBe(true); // [valor] pendente, nada inventado
  });

  it("módulos com regra de liberação do protótipo", () => {
    const by = Object.fromEntries(c.modules.map((m) => [m.id, m.regraLiberacao]));
    expect(by).toMatchObject({ M0: "compra", P1: "trilha_pago", O1: "trilha_org", M6: "compra", M7: "primeira_venda", B1: "compra" });
  });
});
