import { describe, expect, it } from "vitest";
import { etapasDaPasta, faseAtual, type EstadoPasta } from "@/lib/domain/etapas";

const base: EstadoPasta = { tipo: "proprio", dados: {}, divulgacao: null, temEbookPronto: false, temPagina: false, temCriativos: false, temRoteiros: false, temNumeros: false, temVenda: false };

describe("etapas da pasta (fluxo ideal)", () => {
  it("produto próprio começa no Entenda e trava o resto com motivo", () => {
    const et = etapasDaPasta(base);
    expect(et[0]).toMatchObject({ slug: "entenda", agora: true, ok: false });
    expect(et[1]!.travada).toContain("Entenda");
    expect(et.find((x) => x.slug === "divulgar")!.travada).toContain("Falta");
    expect(et.filter((x) => x.agora)).toHaveLength(1);
    // trava em cadeia: ficha e oferta também ficam fechadas
    expect(et.find((x) => x.slug === "ficha")!.travada).toContain("Entenda");
    expect(et.find((x) => x.slug === "oferta")!.travada).toContain("Entenda");
    const depois = etapasDaPasta({ ...base, dados: { feito: { entenda: true } } });
    expect(depois.find((x) => x.slug === "ideias")!.agora).toBe(true);
    expect(depois.find((x) => x.slug === "ficha")!.travada).toContain("Ideias");
  });
  it("afiliada: link e kit só depois da aprovação", () => {
    const e = { ...base, tipo: "sdm" as const, dados: { feito: { entenda: true }, afiliacao: { status: "analise" } } };
    const et = etapasDaPasta(e);
    expect(et.find((x) => x.slug === "link")!.travada).toContain("aprovar");
    const ok = etapasDaPasta({ ...e, dados: { feito: { entenda: true }, afiliacao: { status: "aprovada" } } });
    expect(ok.find((x) => x.slug === "link")!.agora).toBe(true);
  });
  it("afiliação em análise: a aluna segue pra conta e regras enquanto espera", () => {
    const e = { ...base, tipo: "sdm" as const, dados: { feito: { entenda: true }, afiliacao: { status: "analise" } } };
    const et = etapasDaPasta(e);
    expect(et.find((x) => x.slug === "afiliacao")!.agora).toBe(false);
    expect(et.find((x) => x.slug === "conta")!.travada).toBeNull();
    expect(et.find((x) => x.slug === "conta")!.agora).toBe(true);
    expect(et.find((x) => x.slug === "divulgar")!.travada).toContain("Falta");
  });
  it("divulgação mostra pago e/ou orgânico conforme a escolha", () => {
    const pronto = { ...base, tipo: "sdm" as const, dados: { feito: { entenda: true, link: true, kit: true, conta: true, regras: true }, afiliacao: { status: "aprovada" } } };
    expect(etapasDaPasta({ ...pronto, divulgacao: "pago" }).some((x) => x.slug === "pixel")).toBe(true);
    expect(etapasDaPasta({ ...pronto, divulgacao: "pago" }).some((x) => x.slug === "perfil")).toBe(false);
    expect(etapasDaPasta({ ...pronto, divulgacao: "ambos" }).some((x) => x.slug === "perfil")).toBe(true);
    expect(faseAtual({ ...pronto, divulgacao: "org" })).toBe(3);
  });
});
