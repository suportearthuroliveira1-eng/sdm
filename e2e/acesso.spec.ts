import { expect, test } from "@playwright/test";

test("A01 com e-mail sem cadastro leva pra A02", async ({ page }) => {
  await page.goto("/app/a01");
  await expect(page.getByRole("heading", { name: "Seu caminho pra ganhar em dólar, um passo por dia" })).toBeVisible();
  await page.getByLabel("E-mail que você usou na compra").fill(`ninguem-${Date.now()}@exemplo.com`);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app\/a02$/);
  await expect(page.getByRole("heading", { name: "Não recebi meu acesso" })).toBeVisible();
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
