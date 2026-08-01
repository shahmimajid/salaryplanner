import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test("creates a salary entry offline as a draft and syncs it automatically on reconnect", async ({
  page,
  context,
}) => {
  const email = uniqueEmail("offline");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await context.setOffline(true);

  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();

  await expect(page.getByText("Saved offline")).toBeVisible();
  await expect(page.getByText(/1 calculation.*saved offline, not yet synced/)).toBeVisible();

  await context.setOffline(false);

  // Sync is triggered by the browser's "online" event; the drafts banner
  // polls IndexedDB every 3s, so allow it a few cycles to clear.
  await expect(page.getByText(/saved offline, not yet synced/)).toHaveCount(0, {
    timeout: 15000,
  });

  await page.goto("/history");
  await expect(page.getByText("RM 5,000.00 gross")).toBeVisible();
});
