import { describe, expect, it } from "vitest";
import { anuncios, bioLegenda, ganchos, kitPre, kitQuiz, roteiros, type ProdutoBase } from "@/lib/gen/modelo";

const p: ProdutoBase = {
  nome: "Easy Weeknight Dinners", lang: "en", aX: "weeknight dinners", aPt: "os jantares da semana",
  quem: { x: "busy moms", pt: "mães ocupadas" }, dor: { x: "not knowing what to cook", pt: "não saber o que fazer" },
  oque: { x: "a simple ebook", pt: "um ebook simples" }, prom: { x: "Dinner without panic", pt: "Janta sem desespero" },
  hooks: { x: ["It's 6pm.", "Takeout again?", "Too tired"], pt: ["São 18h.", "Delivery de novo?", "Cansada"] },
  img: "photo", tags: "#a #b",
};

describe("motor modelo SDM", () => {
  it("kit de pré-venda tem 7 blocos, idioma de venda + pt, termina no botão", () => {
    const k = kitPre(p);
    expect(k).toHaveLength(7);
    expect(k[0]).toMatchObject({ x: "Dinner without panic", pt: "Janta sem desespero" });
    expect(k[6]!.x).toBe("See how it works");
    expect(k.every((b) => b.x && b.pt)).toBe(true);
  });
  it("quiz: 3 perguntas + resultado + botão", () => {
    const q = kitQuiz({ ...p, lang: "es" });
    expect(q.quiz).toHaveLength(3);
    expect(q.blocos).toHaveLength(5);
    expect(q.blocos[4]!.x).toBe("Ver cómo funciona");
  });
  it("10 ganchos/roteiros, 3 anúncios com gancho/meio/chamada", () => {
    expect(ganchos(p)).toHaveLength(10);
    expect(roteiros(p, ["Texto na tela"])).toHaveLength(10);
    const a = anuncios(p);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((x) => x.gancho.x)).size).toBe(3);
    expect(anuncios(p, 3)[0]!.gancho.x).not.toBe(a[0]!.gancho.x);
  });
  it("não inventa número nem prova", () => {
    const txt = JSON.stringify([kitPre(p), anuncios(p), roteiros(p), bioLegenda(p)]);
    expect(txt).not.toMatch(/\$\s?\d|\d+%|R\$|garant|guarantee|resultado comprovado/i);
  });
});
