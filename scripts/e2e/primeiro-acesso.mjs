// Prints do primeiro acesso no celular (boas-vindas, combinado, perguntas, IA lendo, resultado, caminho).
// Cria teste.primeiro.*@exemplo.com no Supabase: apague depois. Uso: E2E_BASE_URL=http://localhost:3100 node scripts/e2e/primeiro-acesso.mjs <pasta>
import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";
const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const email = `teste.primeiro.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const shot = (n, full = false) => p.screenshot({ path: `${S}/pa-${n}.png`, fullPage: full });
try {
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Maria Teste"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click();
  await p.waitForURL(/\/app\/a04/); await p.waitForTimeout(1500); await shot("1-boas-vindas");
  await p.getByRole("button", { name: "Como funciona o app?" }).click(); await p.waitForTimeout(400); await shot("1b-como-funciona", true);
  await p.getByRole("button", { name: "Vamos começar" }).click(); await p.waitForURL(/a07/); await p.waitForTimeout(1500); await shot("2-combinado", true);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/); await p.waitForTimeout(600); await shot("3-pergunta-1");
  await p.getByRole("button", { name: "Por que essa pergunta?" }).click(); await p.waitForTimeout(300); await shot("3b-por-que");
  const resp = ["Brasil", ["Português"], "1 hora", "Nada agora", "Vídeo orgânico (sem pagar anúncio)", "Prefiro não aparecer", ["Casa e organização"], "Nunca", "Perder dinheiro", "Ter o meu próprio produto"];
  for (const [n, r] of resp.entries()) {
    if (Array.isArray(r)) { for (const o of r) await p.getByRole("checkbox", { name: o }).click(); }
    else await p.getByRole("radio", { name: r }).click();
    if (Array.isArray(r)) await p.getByRole("button", { name: /^Confirmar/ }).click();
    if (n === 6) { await p.waitForTimeout(300); await shot("3c-multipla"); }
    if (n === resp.length - 1) { await p.waitForTimeout(1200); await shot("4-ia-lendo"); }
    await p.waitForTimeout(600);
  }
  await p.waitForURL(/a06/); await p.waitForTimeout(1800); await shot("5-resultado");
  await p.getByRole("button", { name: "Por quê?" }).first().click(); await p.waitForTimeout(300); await shot("5b-por-que", true);
  log("resultado:", (await p.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 400));
  await p.getByRole("link", { name: "Está certo" }).click(); await p.waitForURL(/caminho/); await p.waitForTimeout(1500); await shot("6-caminho", true);
  log("OK");
} catch (e) { log("ERRO", e.message); await shot("erro", true); process.exitCode = 1; }
await b.close();
