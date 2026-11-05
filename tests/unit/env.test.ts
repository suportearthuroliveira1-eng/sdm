import { describe, expect, it } from "vitest";
import { deriveAccessSecret, resolveAppUrl } from "@/lib/env";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/public-config";

describe("config pública e padrões", () => {
  it("Supabase público fixo no código", () => {
    expect(SUPABASE_URL).toBe("https://hcknrrgbmhnqtmenovmk.supabase.co");
    expect(SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")).toBe(true);
  });
  it("segredo do link derivado é estável, longo e depende da chave", () => {
    expect(deriveAccessSecret("a")).toBe(deriveAccessSecret("a"));
    expect(deriveAccessSecret("a")).not.toBe(deriveAccessSecret("b"));
    expect(deriveAccessSecret("a").length).toBeGreaterThanOrEqual(32);
  });
  it("APP_URL cai pro domínio da Vercel", () => {
    expect(resolveAppUrl({ APP_URL: "https://x.com/" })).toBe("https://x.com");
    expect(resolveAppUrl({ VERCEL_PROJECT_PRODUCTION_URL: "sdm.vercel.app", VERCEL_URL: "sdm-abc.vercel.app" })).toBe("https://sdm.vercel.app");
    expect(resolveAppUrl({ VERCEL_URL: "sdm-abc.vercel.app" })).toBe("https://sdm-abc.vercel.app");
    expect(resolveAppUrl({})).toBe("http://localhost:3000");
  });
});
