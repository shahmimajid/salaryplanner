import { test, expect, type Page } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail("history");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

test("saves a calculation, lists it in history, views detail, and deletes it", async ({ page }) => {
  await signUp(page);

  // Save a calculation from the dashboard.
  await page.fill('input[name="basicSalary"]', "19088");
  await page.fill('input[name="weekendSupportManualTotalAmount"]', "1000");
  await page.getByRole("button", { name: "Calculate" }).click();

  await expect(page.getByText("Saved for this month.")).toBeVisible();
  await page.getByRole("link", { name: "View in history" }).click();

  await expect(page).toHaveURL(/\/history\/[^/]+$/);
  await expect(page.getByText(/RM\s?[\d,]+\.\d{2}/).first()).toBeVisible();

  // Appears in the list.
  await page.goto("/history");
  await expect(page.getByText("RM 20,088.00 gross")).toBeVisible();

  // Detail view again, via the list link this time.
  await page.getByText("RM 20,088.00 gross").click();
  await expect(page).toHaveURL(/\/history\/[^/]+$/);
  await expect(page.getByText("Deduction breakdown").first()).toBeVisible();

  // Delete with confirmation.
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Delete this calculation?")).toBeVisible();
  await page.getByRole("button", { name: "Delete permanently" }).click();

  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByText("No saved calculations yet.")).toBeVisible();
});

test("updates the same month's entry instead of duplicating it on recalculation", async ({ page }) => {
  await signUp(page);

  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("RM 5,000.00").first()).toBeVisible();

  // Recalculate the SAME payroll month with a different salary. The "Saved
  // for this month." notice text is identical across both saves, so we wait
  // for the results panel to reflect the new gross salary (a value change,
  // not just presence) before navigating — otherwise the navigation can
  // race ahead of the second save's in-flight request and abort it.
  await page.fill('input[name="basicSalary"]', "6000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("RM 6,000.00").first()).toBeVisible();

  await page.goto("/history");
  // Exactly one entry for this user, reflecting the latest (superseding) save.
  await expect(page.getByText("RM 6,000.00 gross")).toBeVisible();
  await expect(page.getByText("RM 5,000.00 gross")).toHaveCount(0);
});
