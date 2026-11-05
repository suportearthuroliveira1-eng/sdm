import { defineConfig, devices } from "@playwright/test";

// e2e contra o app rodando (pnpm build && pnpm start). Caminho completo na Fase 9.
export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    ...devices["iPhone 13"],
    browserName: "chromium",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
});
