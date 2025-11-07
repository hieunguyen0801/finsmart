import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Thêm Giao dịch" }).click();
  await page.getByRole("button", { name: "Thu tiền" }).click();
  await page.getByPlaceholder("Nhập số tiền").click();
  await page.getByPlaceholder("Nhập số tiền").fill("10000");
  await page.getByRole("button", { name: "💼 Tiền lương" }).click();
  await page.getByRole("textbox", { name: "Nhập ghi chú" }).click();
  await page.getByRole("textbox", { name: "Nhập ghi chú" }).fill("tiền lương");
  await page.locator('input[type="date"]').fill("2025-04-13");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Xác nhận" }).click();
});
