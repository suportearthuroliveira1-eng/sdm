// Fluxo completo com IA real (cadastro → diagnóstico → produto próprio → ideias → ficha → oferta → ebook/PDF → revisão → página → anúncios → professora).
// Cria uma conta teste.ia.*@exemplo.com no Supabase: apague depois. Uso: E2E_BASE_URL=http://localhost:3100 node scripts/e2e/fluxo-ia.mjs <pasta-de-prints>
import { chromium } from "@playwright/test";
import { writeFileSync, appendFileSync } from "node:fs";
const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const email = `teste.ia.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
p.setDefaultTimeout(120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const shot = (n) => p.screenshot({ path: `${S}/f-${n}.png` });
try {
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Teste IA"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click();
  await p.waitForURL(/\/app\/a04/); log("1 cadastro -> boas-vindas");
  await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/a07/);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/); log("2 combinado -> diagnóstico");
  const resp = ["Estados Unidos", ["Português", "Inglês"], "1 hora", "Nada agora", ["Cozinha e receitas"], "Nunca", "Não falar bem o idioma", "Ter o meu próprio produto"];
  for (const r of resp) {
    if (Array.isArray(r)) { for (const o of r) await p.getByRole("checkbox", { name: o }).click(); }
    else await p.getByRole("radio", { name: r }).click();
    await p.getByRole("button", { name: /^Confirmar/ }).click(); // cada resposta tem botão de confirmar
    await p.waitForTimeout(400);
  }
  await p.waitForURL(/a06/); log("3 resultado IA ok"); await shot("a06");
  await p.getByRole("link", { name: "Está certo" }).click(); await p.waitForURL(/caminho/);
  await p.locator("form").filter({ hasText: "Criar meu produto com a IA" }).getByRole("button", { name: "Escolher" }).click();
  await p.waitForURL(B + "/app"); log("4 início:", (await p.locator("#prox").innerText())); await shot("inicio");
  await p.getByRole("link", { name: "Fazer agora" }).click(); await p.waitForURL(/\/entenda/);
  await p.getByRole("button", { name: "Começar passo a passo" }).click(); await p.waitForURL(/\/ideias/); log("5 ideias");
  await p.getByRole("button", { name: /Ver 3 ideias/ }).click();
  await p.getByRole("button", { name: "Escolher esta" }).first().waitFor(); log("6 ideias:", await p.locator("article span.text-\\[17px\\]").allInnerTexts()); await shot("ideias");
  await p.getByRole("button", { name: "Escolher esta" }).first().click(); await p.waitForURL(/\/ficha/); log("7 ficha");
  await p.getByLabel("O que você sabe desse assunto?").fill("Cozinho todo dia pra minha família depois do trabalho, faço marmitas no domingo e congelo. Sei aproveitar sobras e fazer lista de compras barata.");
  await p.getByLabel("O que você NÃO quer prometer?").fill("Emagrecimento e economia de valor certo.");
  await p.getByRole("button", { name: /Gerar a ficha com a IA/ }).click();
  await p.getByText("SUA FICHA", { exact: true }).waitFor(); log("8 ficha IA:", (await p.locator("dl").first().innerText()).replace(/\n/g, " | ").slice(0, 220)); await shot("ficha");
  await p.getByRole("link", { name: /Ficha certa/ }).click(); await p.waitForURL(/\/oferta/);
  await p.getByRole("button", { name: /Montar a oferta/ }).click(); await p.getByText("PREÇO SUGERIDO").waitFor(); log("9 oferta:", (await p.locator(".cd").filter({ hasText: "PREÇO SUGERIDO" }).innerText()).replace(/\n/g, " ")); await shot("oferta");
  await p.getByRole("button", { name: "Aprovar a oferta" }).click(); await p.waitForURL(/\/mercado/); log("10 idioma e país");
  await p.getByRole("radio", { name: /Estados Unidos/ }).click(); await p.getByRole("button", { name: /Confirmar: vender em/ }).click(); await p.waitForURL(/\/ebook/); log("10b ebook");
  await p.getByLabel("Capítulos").selectOption("4"); await p.getByLabel("Tamanho").selectOption("5");
  await p.getByRole("button", { name: /Criar o sumário/ }).click(); await p.getByRole("button", { name: "Aprovar o sumário" }).waitFor(); log("11 sumário ok"); await shot("sumario");
  await p.getByRole("button", { name: "Aprovar o sumário" }).click();
  await p.getByRole("button", { name: /Escrever todos/ }).click();
  await p.getByRole("link", { name: "Baixar PDF" }).waitFor({ timeout: 480000 }); log("12 capítulos prontos"); await shot("ebook");
  const pasta = p.url().split("/")[5];
  const pdf = await p.request.get(`${B}/api/ebook/${pasta}`);
  log("13 PDF:", pdf.status(), pdf.headers()["content-type"], (await pdf.body()).length, "bytes");
  writeFileSync(S + "/ebook.pdf", await pdf.body());
  await p.getByRole("link", { name: /Ebook pronto/ }).click(); await p.waitForURL(/\/revisao/);
  for (const c of await p.getByRole("checkbox").all()) { await c.check(); await p.waitForTimeout(400); }
  await p.getByRole("button", { name: "Marcar etapa como feita" }).click(); await p.waitForURL(/\/pagina/); log("14 revisão feita");
  await p.getByRole("button", { name: /Página de vendas/ }).click(); await p.getByText("PÁGINA DE VENDAS ·").waitFor(); log("15 página:", await p.locator(".kk").filter({ hasText: "BLOCOS" }).innerText()); await shot("pagina");
  await p.getByRole("tab", { name: "Prévia no celular" }).click(); await p.waitForTimeout(500); await shot("pagina-celular");
  await p.goto(B + `/app/dv01/${pasta}`); await p.getByRole("button", { name: "Gerar 3 anúncios" }).click();
  await p.locator("article").first().waitFor(); log("16 anúncios IA:", await p.locator("article").count(), "|", await p.locator("article").first().locator(".tx").first().innerText()); await shot("dv01");
  await p.goto(B + "/app/q01");
  await p.getByLabel("Sua mensagem").fill("O que é CTR?"); await p.getByRole("button", { name: "Enviar" }).click();
  await p.waitForFunction(() => !document.body.innerText.includes("pensando..."), null, { timeout: 60000 }); await p.waitForTimeout(2500);
  log("17 professora:", (await p.locator(".whitespace-pre-line").last().innerText()).slice(0, 260)); await shot("professora");
  await p.goto(B + `/app/p/${pasta}`); log("18 painel:", await p.getByText(/DE \d+ PRONTAS/).innerText()); await shot("painel");
} catch (e) { log("ERRO", e.message.split("\n")[0]); await shot("erro"); log("url", p.url()); }
await b.close();
