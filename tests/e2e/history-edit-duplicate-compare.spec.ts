import { test, expect, type Page } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail("editdup");
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

test("edits a saved calculation, keeping the payroll month locked", async ({ page }) => {
  await signUp(page);
  await saveEntry(page, "2026-01", "5000");

  await page.goto("/history");
  await page.getByText("RM 5,000.00 gross").click();
  await expect(page).toHaveURL(/\/history\/[^/]+$/);

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/history\/[^/]+\/edit$/);
  await expect(page.getByRole("heading", { name: "Edit calculation" })).toBeVisible();
  await expect(page.locator('input[name="payrollMonth"]')).toBeDisabled();
  await expect(page.locator('input[name="basicSalary"]')).toHaveValue("5000");

  await page.fill('input[name="basicSalary"]', "5500");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("RM 5,500.00").first()).toBeVisible();

  await page.goto("/history");
  await expect(page.getByText("RM 5,500.00 gross")).toBeVisible();
  await expect(page.getByText("RM 5,000.00 gross")).toHaveCount(0);
});

test("duplicates into a fresh month without a collision warning", async ({ page }) => {
  await signUp(page);
  await saveEntry(page, "2026-01", "5000");

  await page.goto("/history");
  await page.getByText("RM 5,000.00 gross").click();

  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(page.getByText("Duplicate to another month")).toBeVisible();
  await page.fill("#duplicate-target-month", "2026-02");
  await expect(page.getByText("already exists")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/dashboard\?duplicateFrom=/);
  await expect(page.locator('input[name="basicSalary"]')).toHaveValue("5000");
  await expect(page.locator('input[name="payrollMonth"]')).toHaveValue("2026-02");

  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();

  await page.goto("/history");
  const grossValues = await page.getByText("RM 5,000.00 gross").count();
  expect(grossValues).toBe(2);
});

test("warns before duplicating into a month that already has a saved entry", async ({ page }) => {
  await signUp(page);
  await saveEntry(page, "2026-01", "5000");
  await saveEntry(page, "2026-02", "6000");

  await page.goto("/history");
  await page.getByText("RM 5,000.00 gross").click();

  await page.getByRole("button", { name: "Duplicate" }).click();
  await page.fill("#duplicate-target-month", "2026-02");
  await expect(page.getByText(/already exists.*overwrite/)).toBeVisible();
});

test("compares two saved months side by side", async ({ page }) => {
  await signUp(page);
  await saveEntry(page, "2026-01", "5000");
  await saveEntry(page, "2026-02", "6000");

  await page.goto("/history");
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.getByRole("link", { name: "Compare selected" }).click();

  await expect(page).toHaveURL(/\/history\/compare\?a=/);
  await expect(page.getByText("2026-02 vs 2026-01").or(page.getByText("2026-01 vs 2026-02"))).toBeVisible();
  await expect(page.getByText("RM 5,000.00")).toBeVisible();
  await expect(page.getByText("RM 6,000.00")).toBeVisible();
});
