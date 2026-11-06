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

describe("produto próprio · idioma e país", () => {
  const base = { tipo: "proprio" as const, divulgacao: null, temEbookPronto: false, temPagina: false, temCriativos: false, temRoteiros: false, temNumeros: false, temVenda: false };
  it("ebook só abre depois de escolher o país e o idioma", async () => {
    const { etapasDaPasta } = await import("@/lib/domain/etapas");
    const dados = { feito: { entenda: true }, ideia: { x: 1 }, ficha: { x: 1 }, oferta: { aprovada: true } };
    const sem = etapasDaPasta({ ...base, dados });
    expect(sem.find((e) => e.slug === "mercado")!.agora).toBe(true);
    expect(sem.find((e) => e.slug === "ebook")!.travada).toContain("Idioma e país");
    const com = etapasDaPasta({ ...base, dados: { ...dados, mercado: { pais: "eua" } } });
    expect(com.find((e) => e.slug === "ebook")!.agora).toBe(true);
  });
  it("textos do admin trocam nome e explicação da etapa", async () => {
    const { etapasDaPasta } = await import("@/lib/domain/etapas");
    const l = etapasDaPasta({ ...base, dados: {} }, { ideias: { nome: "Ideias com a IA" } });
    expect(l.find((e) => e.slug === "ideias")!.nome).toBe("Ideias com a IA");
  });
});
