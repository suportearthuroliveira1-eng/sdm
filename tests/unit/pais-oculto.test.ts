import { describe, expect, it } from "vitest";
import { CATALOGO_OCULTO, catalogoAtivo, configOcultoSchema, liberadaNoOculto } from "@/lib/domain/pais-oculto";

const id = "7f1d2c3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f";

describe("País Oculto", () => {
  it("só entra quem está na lista e com a área ligada", () => {
    expect(liberadaNoOculto({ ligado: true, alunas: [id], desligados: [], convite: "" }, id)).toBe(true);
    expect(liberadaNoOculto({ ligado: false, alunas: [id], desligados: [], convite: "" }, id)).toBe(false);
    expect(liberadaNoOculto({ ligado: true, alunas: [], desligados: [], convite: "" }, id)).toBe(false);
  });
  it("países desligados somem do catálogo", () => {
    const c = catalogoAtivo({ ligado: true, alunas: [], desligados: ["portugal"], convite: "" });
    expect(c.some((p) => p.k === "portugal")).toBe(false);
    expect(c.length).toBe(CATALOGO_OCULTO.length - 1);
  });
  it("catálogo sem chave repetida e com moeda da tabela de preço", () => {
    expect(new Set(CATALOGO_OCULTO.map((p) => p.k)).size).toBe(CATALOGO_OCULTO.length);
    for (const p of CATALOGO_OCULTO) expect(["USD", "EUR", "GBP", "BRL"]).toContain(p.moedaPreco);
  });
  it("config recusa id que não é uuid", () => {
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: ["x"] }).success).toBe(false);
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: [id] }).success).toBe(true);
  });
});
