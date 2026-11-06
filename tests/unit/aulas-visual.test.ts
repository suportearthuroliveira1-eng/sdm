import { describe, expect, it } from "vitest";
import {
  AULAS_VISUAL_VAZIO,
  aplicarCor,
  aplicarImagem,
  aulaIdSchema,
  aulaInputSchema,
  aulasVisualSchema,
  imagemDaAula,
  lerAulasVisual,
  limparVisual,
  trilhaIdSchema,
  trilhaInputSchema,
} from "@/lib/domain/aulas-visual";

describe("aulas · códigos", () => {
  it("aceita códigos do conteúdo e recusa o resto", () => {
    for (const id of ["M0", "M7", "PO", "P3", "B-1"]) expect(trilhaIdSchema.safeParse(id).success).toBe(true);
    for (const id of ["0.1", "7.1", "P3.2", "PO.1"]) expect(aulaIdSchema.safeParse(id).success).toBe(true);
    for (const id of ["", "M 7", "M/7", "<x>", "ABCDEFGHIJKLM"]) expect(trilhaIdSchema.safeParse(id).success).toBe(false);
    expect(aulaIdSchema.safeParse("1234567890123456").success).toBe(true);
    expect(aulaIdSchema.safeParse("12345678901234567").success).toBe(false);
  });
});

describe("aulas · visual", () => {
  it("só aceita imagem do próprio app ou https e cor #RRGGBB", () => {
    expect(aulasVisualSchema.safeParse({ modulos: { M1: { capa: "/api/publico/modulos/1-abc.png", cor: "#A98BFF" } }, aulas: { "1.1": { capa: "https://x.com/a.webp" } } }).success).toBe(true);
    expect(aulasVisualSchema.safeParse({ modulos: { M1: { capa: "javascript:alert(1)" } }, aulas: {} }).success).toBe(false);
    expect(aulasVisualSchema.safeParse({ modulos: { M1: { banner: "data:image/png;base64,xx" } }, aulas: {} }).success).toBe(false);
    expect(aulasVisualSchema.safeParse({ modulos: { M1: { cor: "red;}" } }, aulas: {} }).success).toBe(false);
  });
  it("valor salvo estragado vira vazio, sem quebrar", () => {
    expect(lerAulasVisual(null)).toEqual(AULAS_VISUAL_VAZIO);
    expect(lerAulasVisual({ modulos: { M1: { capa: 3 } } })).toEqual(AULAS_VISUAL_VAZIO);
    expect(lerAulasVisual({})).toEqual(AULAS_VISUAL_VAZIO);
  });
  it("troca e remove imagem sem mexer no original", () => {
    const v1 = aplicarImagem(AULAS_VISUAL_VAZIO, "trilha-banner", "M1", "/api/publico/modulos/b.png");
    expect(v1.modulos.M1).toEqual({ banner: "/api/publico/modulos/b.png" });
    expect(AULAS_VISUAL_VAZIO.modulos).toEqual({});
    const v2 = aplicarImagem(v1, "aula-capa", "1.1", "/api/publico/aulas/c.png");
    expect(imagemDaAula(v2, "1.1", "M1")).toBe("/api/publico/aulas/c.png");
    expect(imagemDaAula(v2, "1.2", "M1")).toBe("/api/publico/modulos/b.png");
    expect(imagemDaAula(v2, "1.2", "M2")).toBeNull();
    const v3 = aplicarImagem(v2, "aula-capa", "1.1", null);
    expect(v3.aulas["1.1"]).toBeUndefined();
    const v4 = aplicarCor(v3, "M1", "#112233");
    expect(v4.modulos.M1).toEqual({ banner: "/api/publico/modulos/b.png", cor: "#112233" });
    expect(limparVisual(v4, "trilha", "M1").modulos.M1).toBeUndefined();
  });
});

describe("aulas · formulários", () => {
  it("trilha: vazio vira undefined, ordem opcional", () => {
    const r = trilhaInputSchema.parse({ id: " M7 ", nome: "Escala", parte: "", objetivo: "", regraLiberacao: "compra", ordem: "", cor: "" });
    expect(r).toMatchObject({ id: "M7", nome: "Escala", parte: undefined, ordem: undefined, cor: undefined });
    expect(trilhaInputSchema.safeParse({ id: "M7", nome: "", regraLiberacao: "compra" }).success).toBe(false);
    expect(trilhaInputSchema.safeParse({ id: "M7", nome: "x", regraLiberacao: "outra" }).success).toBe(false);
  });
  it("aula: valida trilha, vídeo https e acessos", () => {
    const base = { id: "7.1", moduleId: "M7", titulo: "Primeira", publicada: true, requerEntitlements: ["up1"], minutos: "12", ordem: "3" };
    expect(aulaInputSchema.parse(base)).toMatchObject({ minutos: 12, ordem: 3, regravar: false });
    expect(aulaInputSchema.safeParse({ ...base, videoUrl: "http://x.com/v" }).success).toBe(false);
    expect(aulaInputSchema.safeParse({ ...base, videoUrl: "https://x.com/v" }).success).toBe(true);
    expect(aulaInputSchema.safeParse({ ...base, requerEntitlements: ["xx"] }).success).toBe(false);
    expect(aulaInputSchema.safeParse({ ...base, moduleId: "M 7" }).success).toBe(false);
  });
});
