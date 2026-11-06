// Entenda simplificado + ficha com um botão só + "O que é?" das etapas (celular 390px).
// Cria teste.entenda.*@exemplo.com no Supabase: apague depois. Uso: E2E_BASE_URL=http://localhost:3100 node scripts/e2e/entenda-ficha.mjs <pasta-de-prints>
import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";
const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const email = `teste.entenda.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const shot = (n, full = true) => p.screenshot({ path: `${S}/e-${n}.png`, fullPage: full });
try {
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Teste Entenda"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click();
  await p.waitForURL(/\/app\/a04/);
  await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/a07/);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/);
  const resp = ["Estados Unidos", ["Português", "Inglês"], "1 hora", "Até US$ 100 por mês", "Os dois", "Só a voz ou as mãos", ["Beleza e cuidado"], "Nunca", "Não falar bem o idioma", "Ter o meu próprio produto"];
  for (const r of resp) {
    if (Array.isArray(r)) { for (const o of r) await p.getByRole("checkbox", { name: o }).click(); }
    else await p.getByRole("radio", { name: r }).click();
    await p.getByRole("button", { name: /^Confirmar/ }).click();
    await p.waitForTimeout(400);
  }
  await p.waitForURL(/a06/); log("diagnóstico ok");
  await p.getByRole("link", { name: "Está certo" }).click(); await p.waitForURL(/caminho/);
  await p.locator("form").filter({ hasText: "Criar meu produto com a IA" }).getByRole("button", { name: "Escolher" }).click();
  await p.waitForURL(B + "/app");
  await p.getByRole("link", { name: "Fazer agora" }).click(); await p.waitForURL(/\/entenda/);
  await p.waitForTimeout(1500); await shot("entenda");
  await p.waitForTimeout(3300); await shot("entenda-2", false);
  await p.getByRole("button", { name: "Começar passo a passo" }).click(); await p.waitForURL(/\/ideias/);
  await shot("ideias-guia", false);
  await p.getByRole("button", { name: /Ver 3 ideias/ }).click();
  await p.getByRole("button", { name: "Escolher esta" }).first().click(); await p.waitForURL(/\/ficha/); log("ficha");
  await shot("ficha");
  await p.getByRole("button", { name: /A IA monta a ficha pra mim/ }).click();
  await p.getByText("SUA FICHA", { exact: true }).waitFor(); log("ficha pronta com um botão");
  await shot("ficha-pronta");
  await p.getByRole("link", { name: /Ficha certa/ }).click(); await p.waitForURL(/\/oferta/);
  await shot("oferta-guia", false);
  log("OK");
} catch (e) { log("ERRO", e.message); await shot("erro"); process.exitCode = 1; }
await b.close();
