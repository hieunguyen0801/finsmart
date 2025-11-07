import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("button", { name: "Trang chủ" }).click();
  await page.getByRole("link", { name: "Xem Toàn Bộ Lịch Sử" }).click();
  await page.getByRole("textbox", { name: "Từ ngày:" }).fill("2024-08-13");
  await page.getByRole("textbox", { name: "Đến ngày:" }).fill("2025-04-13");
  await page.getByRole("textbox", { name: "Từ ngày:" }).fill("2024-03-10");
  await page.getByRole("textbox", { name: "Từ ngày:" }).press("Enter");
  await page.getByRole("textbox", { name: "Đến ngày:" }).fill("2025-05-10");
  await page.getByText("Tiền Bố Mẹ2024-03-10 22:").first().click();
  await page.getByText("Đi Siêu Thị2024-03-11 17:00-").first().click();
  await page.getByText("Mua Sách2024-03-12 15:30-").first().click();
  await page.getByText("Tiền Bố Mẹ2024-03-10 22:").nth(1).click();
  await page.getByRole("button", { name: "Quay lại Home" }).click();
});
