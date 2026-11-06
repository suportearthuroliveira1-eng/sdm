import { describe, expect, it } from "vitest";
import { completo, PERGUNTAS, primeiraPendente, resultadoPorRegras } from "@/lib/domain/diagnostico";

describe("diagnóstico", () => {
  it("10 perguntas, cada uma com o porquê", () => {
    expect(PERGUNTAS).toHaveLength(10);
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

describe("decisão configurável", () => {
  it("peso maior ganha; empate cai no padrão", async () => {
    const { decidir, CONFIG_PADRAO } = await import("@/lib/domain/diagnostico");
    // produto (peso 2) vence ambos (peso 1)
    expect(decidir({ tempo: "2 horas ou mais", objetivo: "Ter o meu próprio produto" }, CONFIG_PADRAO).caminho).toBe("produto");
    expect(decidir({ tempo: "2 horas ou mais", objetivo: "Trabalhar de casa" }, CONFIG_PADRAO).caminho).toBe("ambos");
    expect(decidir({}, CONFIG_PADRAO).caminho).toBe("afiliada");
    const cfg = { ...CONFIG_PADRAO, decisao: { ...CONFIG_PADRAO.decisao, caminhoPadrao: "produto" as const } };
    const empate: import("@/lib/domain/diagnostico").ConfigDiagnostico = { ...cfg, perguntas: [{ k: "a", q: "?", p: "", o: ["x", "y"], regras: { x: { caminho: "afiliada" as const }, y: { caminho: "ambos" as const } } }, { k: "b", q: "?", p: "", o: ["y"], regras: { y: { caminho: "ambos" as const, peso: 1 } } }] };
    expect(decidir({ a: "x", b: "y" }, empate).caminho).toBe("produto");
  });
  it("valida resposta: opção da lista, Outro com texto, múltipla", async () => {
    const { validarResposta, PERGUNTAS } = await import("@/lib/domain/diagnostico");
    const tempo = PERGUNTAS.find((p) => p.k === "tempo")!;
    expect(validarResposta(tempo, "1 hora")).toBe("1 hora");
    expect(validarResposta(tempo, "3 dias")).toBeNull();
    const pais = PERGUNTAS.find((p) => p.k === "pais")!;
    expect(validarResposta(pais, "  Canadá ")).toBe("Canadá");
    const idi = PERGUNTAS.find((p) => p.k === "idiomas")!;
    expect(validarResposta(idi, ["Inglês", "Inglês", "Francês"])).toEqual(["Inglês", "Francês"]);
    expect(validarResposta(idi, [])).toBeNull();
  });
});

describe("verba e preferência de divulgação", () => {
  it("sem verba vai pro orgânico mesmo preferindo pago; preferência vence quando há verba", async () => {
    const { decidir, CONFIG_PADRAO } = await import("@/lib/domain/diagnostico");
    const d = (verba: string, preferencia: string) => decidir({ verba, preferencia }, CONFIG_PADRAO).divulgacao;
    expect(d("Nada agora", "Anúncio pago")).toBe("org");
    expect(d("Nada agora", "Os dois")).toBe("org");
    expect(d("Mais de US$ 300 por mês", "Vídeo orgânico (sem pagar anúncio)")).toBe("org");
    expect(d("Até US$ 100 por mês", "Os dois")).toBe("ambos");
    expect(d("De US$ 100 a US$ 300 por mês", "Não sei, quero a sugestão do app")).toBe("pago");
    expect(d("Nada agora", "Não sei, quero a sugestão do app")).toBe("org");
    expect(d("Até US$ 100 por mês", "Anúncio pago")).toBe("pago");
  });
});
