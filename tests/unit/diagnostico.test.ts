import { describe, expect, it } from "vitest";
import { completo, PERGUNTAS, primeiraPendente, resultadoPorRegras } from "@/lib/domain/diagnostico";

describe("diagnóstico", () => {
  it("8 perguntas, cada uma com o porquê", () => {
    expect(PERGUNTAS).toHaveLength(8);
    expect(PERGUNTAS.every((p) => p.p && p.o.length >= 3)).toBe(true);
  });
  it("sabe onde parou", () => {
    expect(primeiraPendente({ pais: "Brasil", idiomas: [] })).toBe(1);
    expect(completo({ pais: "x" })).toBe(false);
  });
  it("reserva por regras: sem verba = orgânico; Espanha = esp; quer produto = produto", () => {
    const r = resultadoPorRegras({ pais: "Espanha", idiomas: ["Português", "Espanhol"], tempo: "1 hora", verba: "Nada agora", assuntos: ["Cozinha e receitas"], exp: "Nunca", medo: "Perder dinheiro", objetivo: "Ter o meu próprio produto" });
    expect(r.pais_venda.k).toBe("esp");
    expect(r.divulgacao.valor).toBe("org");
    expect(r.caminho.valor).toBe("produto");
    expect(JSON.stringify(r)).not.toMatch(/\$\s?\d|garant/i);
  });
});
