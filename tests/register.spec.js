import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Đăng Ký" }).click();
  await page.getByRole("textbox", { name: "nguyen anh tuan" }).click();
  await page
    .getByRole("textbox", { name: "nguyen anh tuan" })
    .fill("Lê Duy Vũ");
  await page.getByRole("textbox", { name: "nguyen anh tuan" }).press("Tab");
  await page
    .getByRole("textbox", { name: "DD / MM / YYYY" })
    .fill("03/12/2005");
  await page.getByRole("textbox", { name: "example@example.com" }).click();
  await page
    .getByRole("textbox", { name: "example@example.com" })
    .fill("djanh123456@gmail.com");
  await page.getByRole("textbox", { name: "+ 123 456" }).click();
  await page.getByRole("textbox", { name: "+ 123 456" }).fill("+84388113205");
  await page.locator('input[name="username"]').click();
  await page.locator('input[name="username"]').fill("leduyvu123");
  await page.locator('input[name="username"]').press("Tab");
  await page.locator('input[name="password"]').fill("%PokeMon123");
  await page.locator('input[name="confirmPassword"]').click();
  await page.locator('input[name="confirmPassword"]').fill("%PokeMon123");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Đăng Ký" }).click();
});
