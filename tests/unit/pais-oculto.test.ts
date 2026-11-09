import { describe, expect, it } from "vitest";
import { CATALOGO_OCULTO, catalogoAtivo, configOcultoSchema, escassez, liberadaNoOculto, VENDA_PADRAO } from "@/lib/domain/pais-oculto";

const id = "7f1d2c3e-4b5a-4c6d-8e9f-0a1b2c3d4e5f";

describe("País Oculto", () => {
  it("só entra quem está na lista e com a área ligada", () => {
    expect(liberadaNoOculto({ ligado: true, alunas: [id], desligados: [], convite: "", venda: VENDA_PADRAO }, id)).toBe(true);
    expect(liberadaNoOculto({ ligado: false, alunas: [id], desligados: [], convite: "", venda: VENDA_PADRAO }, id)).toBe(false);
    expect(liberadaNoOculto({ ligado: true, alunas: [], desligados: [], convite: "", venda: VENDA_PADRAO }, id)).toBe(false);
  });
  it("o time sempre entra, mesmo fora da lista", () => {
    expect(liberadaNoOculto({ ligado: false, alunas: [], desligados: [], convite: "", venda: VENDA_PADRAO }, id, true)).toBe(true);
  });
  it("países desligados somem do catálogo", () => {
    const c = catalogoAtivo({ ligado: true, alunas: [], desligados: ["portugal"], convite: "", venda: VENDA_PADRAO });
    expect(c.some((p) => p.k === "portugal")).toBe(false);
    expect(c.length).toBe(CATALOGO_OCULTO.length - 1);
  });
  it("catálogo sem chave repetida e com moeda da tabela de preço", () => {
    expect(new Set(CATALOGO_OCULTO.map((p) => p.k)).size).toBe(CATALOGO_OCULTO.length);
    for (const p of CATALOGO_OCULTO) expect(["USD", "EUR", "GBP", "BRL"]).toContain(p.moedaPreco);
  });
  it("config recusa id que não é uuid", () => {
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: ["x"] }).success).toBe(false);
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: ["00000000-0000-0000-0000-000000000001"] }).success).toBe(true);
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: [id] }).success).toBe(true);
  });
  it("escassez só com dado real: vagas e prazo do admin", () => {
    const agora = new Date("2026-11-09T12:00:00Z");
    const base = { ...VENDA_PADRAO, aberta: true, checkoutUrl: "https://pay.hub.la/x" };
    expect(escassez(base, 5, agora)).toEqual({ restantes: null, vagas: null, prazo: null, encerrada: false });
    expect(escassez({ ...base, vagas: 20 }, 5, agora).restantes).toBe(15);
    expect(escassez({ ...base, vagas: 20 }, 25, agora)).toMatchObject({ restantes: 0, encerrada: true });
    expect(escassez({ ...base, fechaEm: "2026-11-09T11:00:00Z" }, 0, agora).encerrada).toBe(true);
    expect(escassez({ ...base, fechaEm: "2026-11-10T11:00:00Z" }, 0, agora).encerrada).toBe(false);
    expect(escassez({ ...base, checkoutUrl: "" }, 0, agora).encerrada).toBe(true);
  });
  it("checkout precisa ser https", () => {
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: [], venda: { checkoutUrl: "http://x" } }).success).toBe(false);
    expect(configOcultoSchema.safeParse({ ligado: true, alunas: [], venda: { checkoutUrl: "https://pay.hub.la/x" } }).success).toBe(true);
  });
});
