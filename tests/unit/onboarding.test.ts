import { describe, expect, it } from "vitest";
import { depoisDe, passoPendente } from "@/lib/domain/onboarding";

const f = { pularBoasVindas: false, pularCombinado: false, permitirDecidirDepois: false };
const nada = { boasVindasEm: null, combinadoEm: null, diagnosticoEm: null, caminho: null };
const d = new Date();

describe("primeiro acesso obrigatório", () => {
  it("segue a ordem boas-vindas → combinado → diagnóstico → caminho", () => {
    expect(passoPendente(nada, f)).toBe("/app/a04");
    expect(passoPendente({ ...nada, boasVindasEm: d }, f)).toBe("/app/a07");
    expect(passoPendente({ ...nada, boasVindasEm: d, combinadoEm: d }, f)).toBe("/app/a05");
    expect(passoPendente({ boasVindasEm: d, combinadoEm: d, diagnosticoEm: d, caminho: null }, f)).toBe("/app/caminho");
    expect(passoPendente({ boasVindasEm: d, combinadoEm: d, diagnosticoEm: d, caminho: "produto" }, f)).toBeNull();
  });
  it("respeita as telas puladas e o 'decidir depois'", () => {
    expect(passoPendente(nada, { ...f, pularBoasVindas: true, pularCombinado: true })).toBe("/app/a05");
    const depois = { boasVindasEm: d, combinadoEm: d, diagnosticoEm: d, caminho: "depois" };
    expect(passoPendente(depois, f)).toBe("/app/caminho");
    expect(passoPendente(depois, { ...f, permitirDecidirDepois: true })).toBeNull();
    expect(depoisDe("a04", f)).toBe("/app/a07");
    expect(depoisDe("a04", { pularCombinado: true })).toBe("/app/a05");
  });
});
