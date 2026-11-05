import { describe, expect, it } from "vitest";
import { canEnterApp, hasProduct, isActive, statusForKind } from "@/lib/domain/entitlements";

describe("entitlements", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  it("só entra com SDM ativo", () => {
    expect(canEnterApp([], now)).toBe(false);
    expect(canEnterApp([{ produto: "up1", status: "active" }], now)).toBe(false);
    expect(canEnterApp([{ produto: "sdm", status: "active" }], now)).toBe(true);
    expect(canEnterApp([{ produto: "sdm", status: "refunded" }], now)).toBe(false);
    expect(canEnterApp([{ produto: "sdm", status: "chargeback" }], now)).toBe(false);
  });
  it("respeita data de fim", () => {
    expect(isActive({ produto: "sdm", status: "active", fimEm: new Date("2026-05-01") }, now)).toBe(false);
    expect(isActive({ produto: "sdm", status: "active", fimEm: new Date("2026-07-01") }, now)).toBe(true);
    expect(hasProduct([{ produto: "d1", status: "active", fimEm: null }], "d1", now)).toBe(true);
  });
  it("compra libera, reembolso e chargeback revogam", () => {
    expect(statusForKind("grant")).toBe("active");
    expect(statusForKind("revoke_refund")).toBe("refunded");
    expect(statusForKind("revoke_chargeback")).toBe("chargeback");
    expect(statusForKind("revoke_cancel")).toBe("revoked");
    expect(statusForKind("ignore")).toBeNull();
  });
});
