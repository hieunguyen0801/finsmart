import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Đăng Nhập" }).click();
  await page.getByRole("textbox", { name: "Nhập tài khoản của bạn" }).click();
  await page
    .getByRole("textbox", { name: "Nhập tài khoản của bạn" })
    .fill("celdoon123");
  await page
    .getByRole("textbox", { name: "Nhập tài khoản của bạn" })
    .press("Tab");
  await page.getByRole("textbox", { name: "Mật Khẩu" }).fill("123");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Đăng Nhập" }).click();
});
