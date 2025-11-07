import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByTestId("login-button").click();
  await page.getByTestId("input-account").click();
  await page
    .getByTestId("input-account")
    .fill("celdoon123");
  await page
    .getByTestId("input-account")
    .press("Tab");
  await page.getByTestId("input-password").fill("123456");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByTestId("login-button").click();
});
