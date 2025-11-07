import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Thêm Giao dịch" }).click();
  await page.getByRole("button", { name: "Chi tiền" }).click();
  await page.getByRole("button", { name: "Khác" }).click();
  await page.getByRole("button", { name: "💰 test-limit" }).click();
  await page.getByPlaceholder("Nhập số tiền").click();
  await page.getByPlaceholder("Nhập số tiền").fill("100000");
  await page.getByRole("textbox", { name: "Nhập ghi chú" }).click();
  await page.getByRole("textbox", { name: "Nhập ghi chú" }).fill("test");
  await page.locator('input[type="date"]').fill("2025-04-13");
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Xác nhận" }).click();
});
