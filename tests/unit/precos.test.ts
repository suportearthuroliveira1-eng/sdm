import { describe, expect, it } from "vitest";
import { checarPreco, faixa, moedaDoPais, PRECOS_PADRAO } from "@/lib/domain/precos";

describe("preço do ebook", () => {
  it("moeda pelo país", () => {
    expect(moedaDoPais("eua")).toBe("USD");
    expect(moedaDoPais("esp")).toBe("EUR");
    expect(moedaDoPais("uk")).toBe("GBP");
    expect(moedaDoPais("br")).toBe("BRL");
    expect(moedaDoPais(null)).toBe("USD");
  });
  it("nunca preço alto: acima do teto é recusado", () => {
    expect(checarPreco(9, "USD")).toBeNull();
    expect(checarPreco(97, "USD")).toContain("alto");
    expect(checarPreco(0, "USD")).toContain("Coloque");
    expect(checarPreco(60, "BRL")).toBeNull();
    expect(checarPreco(70, "BRL")).toContain("alto");
  });
  it("sugestão dentro da faixa e o admin pode trocar a tabela", () => {
    for (const f of Object.values(PRECOS_PADRAO)) expect(f.sugerido >= f.min && f.sugerido <= f.max && f.max <= f.teto).toBe(true);
    expect(faixa("USD", { USD: { sugerido: 12, min: 9, max: 19, teto: 29 } }).sugerido).toBe(12);
  });
});
