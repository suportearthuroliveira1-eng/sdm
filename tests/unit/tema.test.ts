import { describe, expect, it } from "vitest";
import { contraste, cssDoTema, PRESETS, TEMA_PADRAO, temaSchema } from "@/lib/domain/tema";

describe("aparência", () => {
  it("contraste WCAG: branco x preto = 21; padrão do protótipo passa AA", () => {
    expect(Math.round(contraste("#ffffff", "#000000"))).toBe(21);
    expect(contraste("#f4f1f8", TEMA_PADRAO.bg)).toBeGreaterThan(4.5);
    expect(contraste("#140f1f", TEMA_PADRAO.accent)).toBeGreaterThan(4.5);
  });
  it("todos os temas prontos passam AA no texto e nos botões", () => {
    for (const p of PRESETS) {
      expect(contraste("#f4f1f8", p.t.bg)).toBeGreaterThan(4.5);
      expect(contraste("#140f1f", p.t.accent)).toBeGreaterThan(4.5);
      expect(contraste(p.t.accent2, p.t.bg)).toBeGreaterThan(4.5);
    }
  });
  it("só cor #RRGGBB entra no CSS (nada de injeção)", () => {
    expect(temaSchema.safeParse({ ...TEMA_PADRAO, accent: "red;}body{display:none" }).success).toBe(false);
    expect(cssDoTema(TEMA_PADRAO)).toContain("--accent:#a98bff");
  });
});
