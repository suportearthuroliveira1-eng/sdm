import { expect, test } from "@playwright/test";

test("A01 pede e-mail e senha, sem código", async ({ page }) => {
  await page.goto("/app/a01");
  await expect(page.getByRole("heading", { name: "Seu caminho pra ganhar em dólar, um passo por dia" })).toBeVisible();
  await expect(page.getByLabel("E-mail que você usou na compra")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByText(/código/i)).toHaveCount(0);
  await page.getByRole("link", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app\/cadastro$/);
});

test("cadastro recusa senhas diferentes sem criar conta", async ({ page }) => {
  await page.goto("/app/cadastro");
  await page.getByLabel("Seu nome").fill("Teste");
  await page.getByLabel("E-mail").fill(`x-${Date.now()}@exemplo.com`);
  await page.getByLabel("Senha", { exact: true }).fill("abc12345");
  await page.getByLabel("Repita a senha").fill("abc12399");
  await page.getByRole("button", { name: "Criar conta e entrar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "As duas senhas não são iguais." })).toBeVisible();
});

test("A02 reenviar acesso responde sem revelar cadastro", async ({ page }) => {
  await page.goto("/app/a02");
  await page.getByLabel("E-mail da compra").fill(`x-${Date.now()}@exemplo.com`);
  await page.getByRole("button", { name: "Reenviar meu acesso" }).click();
  await expect(page.getByText("Pedido recebido.")).toBeVisible();
});

test("/app sem sessão vai pra A01 e /admin vai pro login do time", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app\/a01$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar$/);
});

test("link de acesso inválido mostra erro sem entrar", async ({ page }) => {
  await page.goto("/acesso/token-falso");
  await page.getByRole("button", { name: "Entrar no app" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Link inválido." })).toBeVisible();
});

test("A03 mostra os passos do iPhone e do Android", async ({ page }) => {
  await page.goto("/app/a03");
  await expect(page.getByRole("radio", { name: "iPhone" })).toBeVisible();
  await page.getByRole("radio", { name: "Android" }).click();
  await expect(page.getByText("Abra este link no Chrome.")).toBeVisible();
  await page.getByRole("button", { name: "Já instalei" }).click();
  await expect(page).toHaveURL(/\/app\/a01$/);
});
