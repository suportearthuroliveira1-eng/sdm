import { describe, expect, it } from "vitest";
import { accessUrl, signAccessToken, verifyAccessToken, whatsappAccessMessage, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/auth/access-link";

const SECRET = "x".repeat(40);
const sid = "8b0f2c55-7f37-4a3f-9c1e-3d2b1a0f9e11";
const jti = "1d4e5a6b-2c3d-4e5f-8a9b-0c1d2e3f4a5b";

describe("link de acesso", () => {
  it("assina e confere", async () => {
    const { token, expiresAt } = await signAccessToken({ studentId: sid, jti }, SECRET);
    const v = await verifyAccessToken(token, SECRET);
    expect(v).toEqual({ ok: true, claims: { sub: sid, jti } });
    expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(71 * 3600_000);
  });

  it("vence em 72h", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const { token } = await signAccessToken({ studentId: sid, jti, now }, SECRET);
    expect((await verifyAccessToken(token, SECRET, new Date("2026-01-03T23:00:00Z"))).ok).toBe(true);
    expect(await verifyAccessToken(token, SECRET, new Date("2026-01-04T00:00:01Z"))).toEqual({ ok: false, reason: "expirado" });
  });

  it("recusa segredo errado e token adulterado", async () => {
    const { token } = await signAccessToken({ studentId: sid, jti }, SECRET);
    expect((await verifyAccessToken(token, "y".repeat(40))).ok).toBe(false);
    expect((await verifyAccessToken(token.slice(0, -2) + "aa", SECRET)).ok).toBe(false);
    expect((await verifyAccessToken("lixo", SECRET)).ok).toBe(false);
  });

  it("monta url e mensagem do WhatsApp com o primeiro nome", () => {
    const url = accessUrl("https://app.exemplo.com/", "abc");
    expect(url).toBe("https://app.exemplo.com/acesso/abc");
    const msg = whatsappAccessMessage(DEFAULT_WHATSAPP_TEMPLATE, { nome: "Maria Clara Souza", link: url });
    expect(msg).toContain("Oi, Maria!");
    expect(msg).toContain(url);
    expect(msg).toContain("72h");
  });
});
