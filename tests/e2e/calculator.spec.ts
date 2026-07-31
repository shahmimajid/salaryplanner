import { test, expect } from "@playwright/test";

test("calculates and displays a salary breakdown with weekend support", async ({
  page,
}) => {
  await page.goto("/");

  await page.fill('input[name="basicSalary"]', "19088");
  await page.fill('input[name="weekendSupportManualTotalAmount"]', "1000");
  await page.getByRole("button", { name: "Calculate" }).click();

  await expect(page.getByText("Net salary").first()).toBeVisible();
  await expect(page.getByText(/RM\s?[\d,]+\.\d{2}/).first()).toBeVisible();
  await expect(
    page.getByText("Net weekend-support amount").first(),
  ).toBeVisible();
  await expect(
    page.getByText(/Verify final payroll deductions/i),
  ).toBeVisible();
});

test("switches the visible weekend-support fields with the payment method", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.locator('input[name="weekendSupportManualTotalAmount"]'),
  ).toBeVisible();
  await expect(
    page.locator('input[name="weekendSupportFixedRatePerDay"]'),
  ).toHaveCount(0);

  await page
    .getByRole("radio", { name: "Fixed amount per support day" })
    .click();

  await expect(
    page.locator('input[name="weekendSupportFixedRatePerDay"]'),
  ).toBeVisible();
  await expect(
    page.locator('input[name="weekendSupportDaysCount"]'),
  ).toBeVisible();
  await expect(
    page.locator('input[name="weekendSupportManualTotalAmount"]'),
  ).toHaveCount(0);
});
