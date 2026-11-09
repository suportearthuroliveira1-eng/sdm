// Varredura de TODAS as etapas, pela tela, como a aluna faria (os dois caminhos + divulgação paga e orgânica).
// Usa IA de verdade e o banco LOCAL (marca a conta como admin pra aprovar a afiliação).
// Cria teste.varredura.*@exemplo.com no Supabase: apague depois.
// Uso: E2E_BASE_URL=http://localhost:3100 node scripts/e2e/varredura.mjs <pasta-de-prints>
import { chromium } from "@playwright/test";
import { appendFileSync } from "node:fs";
import pg from "pg";

const S = process.argv[2] ?? ".", B = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const DB = process.env.SEED_DB_URL ?? "postgres://sdm:sdm@localhost/sdm_test";
const email = `teste.varredura.${Date.now()}@exemplo.com`, senha = "Fluxo12345";
appendFileSync(S + "/teste-contas.txt", email + "\n");
const db = new pg.Client({ connectionString: DB });
await db.connect();
const q = async (sql, args = []) => (await db.query(sql, args)).rows;

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
p.setDefaultTimeout(120000);
const t0 = Date.now();
const log = (...a) => console.log(`[${Math.round((Date.now() - t0) / 1000)}s]`, ...a);
const problemas = [];
const shot = (n) => p.screenshot({ path: `${S}/var-${n}.png` });

/** Estado das etapas da pasta pelo painel (texto "X DE Y PRONTAS"). */
async function placar(id) {
  await p.goto(`${B}/app/p/${id}`);
  return (await p.getByText(/DE \d+ PRONTAS/).innerText()).trim();
}
/** Marca as caixinhas bem rápido (testa a gravação atômica) e confere depois de recarregar. */
async function abrir(url) {
  await p.goto(url);
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.locator("h1").first().waitFor();
}
async function checklistTudo(id, slug, pular = 0) {
  await abrir(`${B}/app/p/${id}/${slug}${slug === "perfil" ? "?parte=aquecimento" : ""}`);
  await p.locator('input[type="checkbox"]').first().waitFor({ timeout: 30000 }).catch(() => {});
  const caixas = p.locator('input[type="checkbox"]');
  const n = await caixas.count();
  const alvo = n - pular;
  // cliques rápidos em sequência, sem esperar a gravação (como alguém marcando tudo de uma vez)
  for (let i = 0; i < alvo; i++) if (!(await caixas.nth(i).isChecked())) await caixas.nth(i).click({ delay: 0 });
  await p.waitForTimeout(2500);
  await p.reload();
  const marcadas = await p.locator('input[type="checkbox"]:checked').count();
  if (marcadas !== alvo) problemas.push(`${slug}: marcou ${alvo}, ficaram ${marcadas} depois de recarregar`);
  log(`  ${slug}: ${marcadas}/${n} caixinhas salvas`);
  if (pular) await p.getByRole("button", { name: /concluir assim mesmo/ }).click();
  await p.getByRole("button", { name: "Marcar etapa como feita" }).click();
  await p.waitForURL((u) => !u.pathname.endsWith(`/${slug}`), { timeout: 30000 }).catch(async () => { problemas.push(`${slug}: não saiu da etapa depois de marcar`); await shot(`falha-${slug}`); });
}
async function etapaOk(id) {
  const r = await q("select dados from student_products where id=$1", [id]);
  return r[0]?.dados;
}

try {
  // ---------- cadastro + primeiro acesso (os dois caminhos) ----------
  await p.goto(B + "/app/cadastro");
  await p.getByLabel("Seu nome").fill("Teste Varredura"); await p.getByLabel("E-mail").fill(email);
  await p.getByLabel("Senha", { exact: true }).fill(senha); await p.getByLabel("Repita a senha").fill(senha);
  await p.getByRole("button", { name: "Criar conta e entrar" }).click(); await p.waitForURL(/a04/);
  await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/a07/);
  await p.getByRole("button", { name: "Combinado" }).click(); await p.waitForURL(/a05/);
  for (const r of ["Estados Unidos", ["Português", "Inglês"], "2 horas ou mais", "Até US$ 100 por mês", "Os dois", "Sim, apareço", ["Casa e organização"], "Já tentei", "Perder dinheiro", "Ter uma renda extra em dólar"]) {
    if (Array.isArray(r)) for (const o of r) await p.getByRole("checkbox", { name: o }).click(); else await p.getByRole("radio", { name: r }).click();
    if (Array.isArray(r)) await p.getByRole("button", { name: /^Confirmar/ }).click();
    await p.waitForTimeout(500);
  }
  await p.waitForURL(/a06/); await p.getByRole("link", { name: "Está certo" }).click(); await p.waitForURL(/caminho/);
  await p.locator("form").filter({ hasText: "Os dois" }).getByRole("button", { name: "Escolher" }).click(); await p.waitForURL(B + "/app");
  const [aluna] = await q("select id from students where email=$1", [email]);
  const pastas = await q("select id, tipo from student_products where student_id=$1", [aluna.id]);
  const sdm = pastas.find((x) => x.tipo === "sdm").id, prop = pastas.find((x) => x.tipo === "proprio").id;
  log("1 primeiro acesso ok · pastas:", pastas.map((x) => x.tipo).join(", "));

  // ---------- caminho B: produto próprio ----------
  if (!process.env.SO_SDM) {
  await p.goto(`${B}/app/p/${prop}/entenda`);
  await p.getByRole("button", { name: /A IA faz tudo pra mim/ }).click(); await p.getByRole("button", { name: "Pode fazer" }).click();
  await p.getByRole("heading", { name: /Pronto! Seu produto está montado/ }).waitFor({ timeout: 600000 });
  log("2 A IA fez tudo ·", await placar(prop));
  await checklistTudo(prop, "revisao");
  await p.goto(`${B}/app/p/${prop}/pagina`);
  await p.getByRole("button", { name: /Página de vendas \(recomendado\)/ }).click();
  await p.getByRole("link", { name: "Próxima etapa" }).waitFor({ timeout: 120000 }); log("  pagina: página escrita");
  await abrir(`${B}/app/p/${prop}/plataforma`);
  await p.getByLabel("Link do checkout").fill("https://example.com/checkout");
  await p.getByRole("button", { name: /Colar e conferir/ }).click();
  await p.locator(".good, p[role=alert]").first().waitFor({ timeout: 40000 }).catch(() => {});
  log("  plataforma: resultado do teste:", (await p.locator(".good, p[role=alert]").first().innerText().catch(() => "(nada)")).slice(0, 90));
  if (await p.getByRole("button", { name: /está certo: seguir/ }).count()) { await p.getByRole("button", { name: /está certo: seguir/ }).click(); log("  plataforma: confirmado pela aluna"); }
  await p.getByRole("link", { name: "Próxima etapa", exact: true }).waitFor({ timeout: 30000 }).catch(async () => { problemas.push("plataforma: não liberou a próxima"); await shot("falha-plataforma"); });
  await checklistTudo(prop, "conta");
  await checklistTudo(prop, "teste", 1); // deixa 1 sem marcar e usa "concluir assim mesmo"
  await p.goto(`${B}/app/p/${prop}/divulgar`);
  await p.locator("form").filter({ hasText: "Os dois" }).getByRole("button").click(); await p.waitForURL(new RegExp(`/app/p/${prop}$`));
  log("3 estrutura do produto ·", await placar(prop));

  // divulgação (paga + orgânica)
  await checklistTudo(prop, "base-anuncios");
  await abrir(`${B}/app/dv01/${prop}?aba=anuncios`);
  await p.getByRole("button", { name: "Gerar 3 anúncios" }).click(); await p.getByRole("button", { name: "Gerar mais 3 anúncios" }).waitFor({ timeout: 120000 }); log("  criativos: 3 anúncios");
  await abrir(`${B}/app/dv01/${prop}?aba=roteiros`);
  await p.getByRole("button", { name: "Gerar 10 roteiros" }).click(); await p.getByRole("button", { name: "Gerar de novo" }).first().waitFor({ timeout: 120000 }); log("  roteiros: gerados");
  log("  criativos: botão de seguir ->", await p.getByRole("link", { name: /Seguir|Concluir/ }).first().innerText().catch(() => "(nenhum)"));
  await checklistTudo(prop, "pixel");
  for (const [slug, campos] of [["numeros", { "Gasto (US$)": "5", CPM: "12", "CTR (%)": "1.4", CPC: "0.8", Vendas: "0" }], ["numeros-org", { "Visualizações": "350", "Seguidores novos": "4", "Comentários": "2" }]]) {
    await p.goto(`${B}/app/p/${prop}/${slug}`);
    for (const [k, v] of Object.entries(campos)) await p.getByLabel(k, { exact: true }).fill(v);
    await p.getByRole("button", { name: "Salvar números" }).click(); await p.locator("table").waitFor({ timeout: 30000 }).catch(() => problemas.push(`${slug}: números não apareceram`));
    log(`  ${slug}: números salvos`);
  }
  await checklistTudo(prop, "perfil");
  const fimProp = await placar(prop); log("4 produto próprio ·", fimProp); await shot("proprio");
  const etProp = await p.locator("ol li").allInnerTexts();
  for (const e of etProp) if (/abre depois|Termine|fechad|agora/.test(e)) problemas.push(`produto: etapa não concluída → ${e.replace(/\n/g, " ")}`);
  }

  // ---------- caminho A: afiliada do SDM ----------
  await p.goto(`${B}/app/p/${sdm}/entenda`); await p.getByRole("button", { name: "Começar" }).click(); await p.waitForURL(/afiliacao/);
  await p.getByRole("button", { name: "Quero ser afiliada" }).click(); await p.getByText("Em análise").waitFor(); log("5 afiliação pedida");
  await q("insert into admin_users(auth_user_id,email,nome,papel) select auth_user_id, email, 'T', 'admin' from students where id=$1 on conflict do nothing", [aluna.id]);
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(`${B}/admin/afiliacao`); await p.getByLabel(/Link de afiliada dela/).first().fill("https://example.com/afiliada/teste");
  await p.getByRole("button", { name: "Aprovar" }).first().click(); await p.waitForTimeout(2500);
  await p.setViewportSize({ width: 390, height: 844 });
  const af = (await etapaOk(sdm)).afiliacao; log("  admin aprovou:", af?.status, af?.link ? "com link" : "SEM LINK");
  if (af?.status !== "aprovada") problemas.push("afiliação: admin aprovou mas não ficou aprovada");
  await p.goto(`${B}/app/p/${sdm}/link`); await p.getByRole("button", { name: "Copiei e testei o meu link" }).click(); await p.waitForURL((u) => !u.pathname.endsWith("/link"));
  await p.goto(`${B}/app/p/${sdm}/kit`); await p.getByRole("button", { name: "Já separei as minhas peças" }).click(); await p.waitForURL((u) => !u.pathname.endsWith("/kit"));
  await checklistTudo(sdm, "conta");
  await checklistTudo(sdm, "regras");
  await p.goto(`${B}/app/p/${sdm}/divulgar`);
  await p.locator("form").filter({ hasText: "Vídeo orgânico" }).getByRole("button").click(); await p.waitForURL(new RegExp(`/app/p/${sdm}$`));
  await checklistTudo(sdm, "perfil");
  await abrir(`${B}/app/dv01/${sdm}?aba=roteiros`);
  if (await p.getByRole("button", { name: /Vou usar as peças do kit/ }).count()) {
    await p.getByRole("button", { name: /Vou usar as peças do kit/ }).click(); await p.waitForURL((u) => !u.pathname.includes("/dv01/")); log("  roteiros: sem ficha do SDM → usou o kit e seguiu");
  } else {
    await p.getByRole("button", { name: "Gerar 10 roteiros" }).click(); await p.getByRole("button", { name: "Gerar de novo" }).first().waitFor({ timeout: 120000 });
  }
  await p.goto(`${B}/app/p/${sdm}/numeros-org`);
  await p.getByLabel("Visualizações", { exact: true }).fill("120"); await p.getByRole("button", { name: "Salvar números" }).click(); await p.locator("table").waitFor({ timeout: 30000 });
  // link da bio: página de links abre (não redireciona) e o botão leva pro link de afiliada
  const [{ bio_code }] = await q("select bio_code from student_products where id=$1", [sdm]);
  await abrir(`${B}/l/${bio_code}`); log("  página da bio:", (await p.locator("main").innerText()).replace(/\n/g, " | ").slice(0, 120));
  const fimSdm = await placar(sdm); log("6 afiliada do SDM ·", fimSdm); await shot("sdm");
  for (const e of await p.locator("ol li").allInnerTexts()) if (/abre depois|Termine|fechad|agora/.test(e)) problemas.push(`afiliada: etapa não concluída → ${e.replace(/\n/g, " ")}`);
  await q("delete from admin_users where email=$1", [email]);
} catch (e) {
  problemas.push(`ERRO: ${e.message.split("\n")[0]} em ${p.url()}`);
  await shot("erro");
}
log(problemas.length ? `PROBLEMAS (${problemas.length}):\n- ${problemas.join("\n- ")}` : "TUDO OK: todas as etapas concluídas pela tela");
await db.end();
await b.close();
