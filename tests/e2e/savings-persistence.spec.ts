import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test("saves a savings plan and it survives a reload via the edit page and detail summary", async ({
  page,
}) => {
  const email = uniqueEmail("savingspersist");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();

  await page.fill('input[name="monthlySavingsTarget"]', "400");
  await page.fill('input[name="allocations.GENERAL_SAVINGS.amount"]', "500");
  await page.getByRole("button", { name: "Save savings plan" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // Detail view's read-only summary reflects the persisted plan.
  await page.getByRole("link", { name: "View in history" }).click();
  await expect(page.getByText("Monthly savings", { exact: true })).toBeVisible();
  await expect(page.getByText("RM 500.00").first()).toBeVisible();

  // Edit page hydrates the form from the persisted plan, not the defaults —
  // the savings planner only renders after Calculate (it needs a result).
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.locator('input[name="allocations.GENERAL_SAVINGS.amount"]')).toHaveValue(
    "500",
  );
  await expect(page.locator('input[name="monthlySavingsTarget"]')).toHaveValue("400");
});
