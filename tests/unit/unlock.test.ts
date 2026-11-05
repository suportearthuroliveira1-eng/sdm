import { describe, expect, it } from "vitest";
import { lessonLock, moduleLock } from "@/lib/domain/unlock";

const base = { trilhaPago: false, trilhaOrg: false, temVenda: false, produtos: ["sdm" as const] };

describe("desbloqueio", () => {
  it("compra abre na hora; trilhas só depois de escolher; M7 só com venda", () => {
    expect(moduleLock("compra", base).travado).toBe(false);
    expect(moduleLock("trilha_pago", base).travado).toBe(true);
    expect(moduleLock("trilha_pago", { ...base, trilhaPago: true }).travado).toBe(false);
    expect(moduleLock("trilha_org", { ...base, trilhaPago: true }).travado).toBe(true);
    expect(moduleLock("primeira_venda", base).travado).toBe(true);
    expect(moduleLock("primeira_venda", { ...base, temVenda: true }).travado).toBe(false);
  });
  it("PO abre com UP1 ou D1 e sempre diz o motivo e a ação", () => {
    const l = lessonLock(["up1", "d1"], "compra", base);
    expect(l.travado && l.motivo).toContain("UP1");
    expect(l.travado && l.acao.href).toBeTruthy();
    expect(lessonLock(["up1", "d1"], "compra", { ...base, produtos: ["sdm", "d1"] }).travado).toBe(false);
  });
});
