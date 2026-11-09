import { describe, expect, it } from "vitest";
import { ETAPAS_DIVULGACAO_BASE, ETAPAS_ORG, ETAPAS_PAGO, ETAPAS_PROPRIO, ETAPAS_SDM } from "@/lib/domain/etapas";
import { fasesDa, indiceDaFase } from "@/lib/domain/jornada";

describe("jornada em fases", () => {
  it("toda etapa cai numa fase, sem repetir", () => {
    for (const [tipo, est] of [["proprio", ETAPAS_PROPRIO], ["sdm", ETAPAS_SDM]] as const) {
      const fases = fasesDa(tipo);
      for (const e of [...est, ...ETAPAS_DIVULGACAO_BASE, ...ETAPAS_PAGO, ...ETAPAS_ORG]) {
        expect(fases.filter((f) => f.slugs.includes(e.slug)).length, `${tipo}:${e.slug}`).toBe(1);
      }
    }
  });
  it("divulgação é a última fase", () => {
    const f = fasesDa("proprio");
    expect(indiceDaFase(f, "pixel")).toBe(f.length - 1);
    expect(indiceDaFase(f, "entenda")).toBe(0);
  });
});
