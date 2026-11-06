// "A IA faz tudo": cadastro → diagnóstico → produto → piloto automático até a Revisão.
// Cria uma conta teste.piloto.*@exemplo.com no Supabase: apague depois. Uso: E2E_BASE_URL=... node scripts/e2e/piloto-ia.mjs <pasta-de-prints>
import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";
const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const email = `teste.piloto.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
p.setDefaultTimeout(120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const shot = (n) => p.screenshot({ path: `${S}/piloto-${n}.png` });
try {
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Teste Piloto"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click(); await p.waitForURL(/a04/);
  await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/a07/);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/);
  for (const r of ["Estados Unidos", ["Português", "Inglês"], "1 hora", "Nada agora", ["Casa e organização"], "Nunca", "Perder dinheiro", "Ter o meu próprio produto"]) {
    if (Array.isArray(r)) for (const o of r) await p.getByRole("checkbox", { name: o }).click(); else await p.getByRole("radio", { name: r }).click();
    await p.getByRole("button", { name: /^Confirmar/ }).click(); await p.waitForTimeout(300);
  }
  await p.waitForURL(/a06/); await p.getByRole("link", { name: "Está certo" }).click(); await p.waitForURL(/caminho/);
  await p.locator("form").filter({ hasText: "Criar meu produto com a IA" }).getByRole("button", { name: "Escolher" }).click(); await p.waitForURL(B + "/app");
  await p.getByRole("link", { name: "Fazer agora" }).click(); await p.waitForURL(/\/entenda/); log("1 entenda"); await shot("entenda");
  await p.getByRole("button", { name: /A IA faz tudo pra mim/ }).click(); await p.getByRole("button", { name: "Pode fazer" }).click(); log("2 piloto rodando");
  await p.waitForTimeout(6000); await shot("rodando");
  await p.getByRole("heading", { name: /Pronto! Seu produto está montado/ }).waitFor({ timeout: 480000 }); log("3 PRONTO"); await shot("pronto");
  await p.getByRole("button", { name: "Ir pra Revisão" }).click(); await p.waitForURL(/\/revisao/); log("4 revisão aberta");
  const pasta = p.url().split("/")[5];
  await p.goto(B + `/app/p/${pasta}`); log("5 painel:", await p.getByText(/DE \d+ PRONTAS/).innerText()); await shot("painel");
  await p.goto(B + `/app/p/${pasta}/ficha`); log("6 ficha:", (await p.locator("dl").first().innerText()).replace(/\n/g, " | ").slice(0, 200));
} catch (e) {
  log("ERRO", e.message.split("\n")[0]); log("url", p.url()); await shot("erro");
}
await b.close();
