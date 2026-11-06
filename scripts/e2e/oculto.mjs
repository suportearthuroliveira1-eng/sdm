// País Oculto (portão, mapa, estratégia, criar produto) + telas novas do admin (Aulas, Marca, Time, País Oculto).
// Usa IA de verdade e o banco LOCAL (vira admin e se libera no País Oculto). Cria teste.oculto.*@exemplo.com no Supabase: apague depois.
// Uso: E2E_BASE_URL=http://localhost:3100 node scripts/e2e/oculto.mjs <pasta-de-prints>
import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";
import pg from "pg";

const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const DB = process.env.SEED_DB_URL ?? "postgres://sdm:sdm@localhost/sdm_test";
const email = `teste.oculto.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const db = new pg.Client({ connectionString: DB });
await db.connect();
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(150000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const shot = (n, full = false) => p.screenshot({ path: `${S}/o-${n}.png`, fullPage: full });
try {
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Teste Oculto"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click();
  await p.waitForURL(/\/app\/a04/);
  await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/a07/);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/);
  const resp = ["Brasil", ["Português", "Inglês"], "1 hora", "Até US$ 100 por mês", "Os dois", "Só a voz ou as mãos", ["Casa e organização"], "Já tentei", "Perder dinheiro", "Ter o meu próprio produto"];
  for (const r of resp) {
    if (Array.isArray(r)) { for (const o of r) await p.getByRole("checkbox", { name: o }).click(); }
    else await p.getByRole("radio", { name: r }).click();
    await p.getByRole("button", { name: /^Confirmar/ }).click();
    await p.waitForTimeout(400);
  }
  await p.waitForURL(/a06/); log("diagnóstico ok");
  const [{ id }] = (await db.query("select id from students where email = $1", [email])).rows;
  // sem acesso: a página não existe
  const r404 = await p.goto(B + "/app/oculto"); log("sem acesso →", r404?.status());
  await db.query("insert into admin_users (email, papel) values ($1, 'admin') on conflict (email) do update set papel='admin', ativo=true", [email]);
  await db.query(`insert into settings (key, value, grupo) values ('pais_oculto', $1::jsonb, 'acesso') on conflict (key) do update set value = $1::jsonb`, [JSON.stringify({ ligado: true, alunas: [id], desligados: [], convite: "" })]);
  await p.goto(B + "/app"); await p.getByText("País Oculto").first().waitFor(); await shot("inicio-convite");
  await p.getByRole("link", { name: /País Oculto/ }).click(); await p.waitForURL(/\/app\/oculto/);
  await p.waitForTimeout(800); await shot("portao");
  await p.getByRole("button", { name: /Girar a chave/ }).click();
  await p.waitForTimeout(500); await shot("portao-chave");
  await p.waitForTimeout(900); await shot("portao-abrindo");
  await p.getByRole("button", { name: "Entrar" }).click(); log("portão aberto");
  await shot("mapa-fechado");
  await p.getByRole("button", { name: /Revelar os meus países ocultos/ }).click();
  await p.waitForTimeout(3000); await shot("mapa-carregando");
  await p.getByRole("button", { name: /estratégia secreta/ }).first().waitFor(); log("mapa revelado");
  await p.waitForTimeout(400); await shot("mapa-virando");
  await p.waitForTimeout(2500); await shot("mapa", true);
  await p.getByRole("button", { name: /estratégia secreta/ }).first().click();
  await p.getByText("Estratégia secreta ·").waitFor(); log("estratégia pronta");
  await p.waitForTimeout(2500); await shot("estrategia", true);
  await p.getByRole("button", { name: /Criar este produto com a IA/ }).click();
  await p.waitForURL(/\/ficha/); log("produto criado → ficha"); await shot("ficha-oculto");
  // admin
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(B + "/admin/pais-oculto"); await shot("admin-oculto", true);
  await p.goto(B + "/admin/aulas"); await shot("admin-aulas", true);
  await p.goto(B + "/admin/marca");
  await p.locator('input[type=file]').first().setInputFiles("public/icons/icon-512.png");
  await p.getByRole("button", { name: "Salvar imagem" }).first().click();
  await p.getByText("Foto trocada.").waitFor(); log("foto enviada"); await shot("admin-marca", true);
  await p.goto(B + "/admin/time"); await shot("admin-time", true);
  await p.goto(B + "/admin/alunas"); await shot("admin-alunas", true);
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(B + "/app"); await shot("inicio-amanda", true);
  log("OK");
} catch (e) { log("ERRO", e.message); await shot("erro", true); process.exitCode = 1; }
await db.end();
await b.close();
