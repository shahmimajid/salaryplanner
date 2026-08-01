import { test, expect, type Page } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail("annual");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

// Both .fill() and a native-setter + dispatchEvent trick are unreliable on
// this react-hook-form-controlled input[type=month] right after
// navigation: under load (2 CI workers) a hydration-driven re-render can
// land after the set and stomp the DOM value back to react-hook-form's
// still-default state — inconsistently, not deterministically. Retrying
// the whole set+assert via toPass() rides out the race instead of hoping
// to win it on the first attempt.
async function fillMonth(page: Page, month: string) {
  await expect(async () => {
    await page.locator('input[name="payrollMonth"]').evaluate((el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, month);
    await expect(page.locator('input[name="payrollMonth"]')).toHaveValue(month, { timeout: 500 });
  }).toPass({ timeout: 10000 });
}

async function saveEntry(page: Page, month: string, basicSalary: string) {
  await page.goto("/dashboard");
  await fillMonth(page, month);
  await page.fill('input[name="basicSalary"]', basicSalary);
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();
}

test("filters history by year", async ({ page }) => {
  await signUp(page);
  // The seeded payroll config only covers 2026-01-01 onward (effectiveTo:
  // null) — use 2026/2027, not a genuinely past year, so both saves
  // actually resolve a config.
  await saveEntry(page, "2027-06", "4000");
  await saveEntry(page, "2026-01", "5000");

  await page.goto("/history");
  await expect(page.getByRole("link", { name: "2026", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "2027", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "2027", exact: true }).click();
  await expect(page).toHaveURL(/\/history\?year=2027$/);
  await expect(page.getByText("RM 4,000.00 gross")).toBeVisible();
  await expect(page.getByText("RM 5,000.00 gross")).toHaveCount(0);
});

test("annual totals sum saved months, including a saved savings plan", async ({ page }) => {
  await signUp(page);
  await saveEntry(page, "2026-01", "5000");

  // Save a savings plan for this month so "Total savings" is real, not 0.
  await page.fill('input[name="allocations.GENERAL_SAVINGS.amount"]', "500");
  await page.getByRole("button", { name: "Save savings plan" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await saveEntry(page, "2026-02", "6000");

  await page.goto("/history/annual?year=2026");
  await expect(page.getByText("Total net salary")).toBeVisible();
  // The same figures also appear in the chart's sr-only data table, so
  // scope to the first (visible stat card) match rather than asserting a
  // unique element.
  await expect(page.getByText("RM 11,000.00").first()).toBeVisible(); // total basic salary
  await expect(page.getByText("RM 500.00").first()).toBeVisible(); // total savings
});
