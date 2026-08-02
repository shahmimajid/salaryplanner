import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";

// Prisma's generated client is ESM-only and Playwright's test loader can't
// import.meta-resolve it, so this promotes the user with a raw `pg` query
// instead of going through @/lib/db/prisma (the only e2e spec that touches
// the database directly rather than driving the browser).
async function promoteToAdmin(email: string): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('UPDATE "users" SET role = $1 WHERE email = $2', ["ADMIN", email]);
  await client.end();
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

const PASSWORD = "correct horse battery staple";

async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail("admin");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.fill('input[name="confirmPassword"]', PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/signin");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

function setMonthInput(page: Page, value: string) {
  return page
    .locator('input[name="payrollMonth"]')
    .evaluate((el: HTMLInputElement, v: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
}

async function saveCalculation(page: Page, payrollMonth: string, basicSalary: string): Promise<string> {
  await page.goto("/dashboard");
  await setMonthInput(page, payrollMonth);
  await page.fill('input[name="basicSalary"]', basicSalary);
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();
  await page.getByRole("link", { name: "View in history" }).click();
  await expect(page).toHaveURL(/\/history\/[^/]+$/);
  return page.url();
}

test("redirects a non-admin away from /admin", async ({ page }) => {
  await signUp(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("admin creates a new configuration version, and it applies only going forward", async ({
  page,
}) => {
  const email = await signUp(page);

  // Calculation under the seeded 2026.1 config (SOCSO employee = RM39.75
  // for CATEGORY_1 at this wage, per prisma/seed-data/payroll-config.default.v2026.1.json).
  const beforeUrl = await saveCalculation(page, "2026-01", "3000");
  await expect(page.getByText("RM 39.75").first()).toBeVisible();

  // Promote via direct SQL — there is no self-service promotion UI by
  // design (docs' "Bootstrapping the first real admin is a manual step").
  await promoteToAdmin(email);

  // A role change only takes effect on next sign-in (JWT sessions can't be
  // invalidated mid-session — docs/assumptions.md #28).
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, email);

  await page.goto("/admin");
  await expect(page.getByText("2026.1")).toBeVisible();

  await page.goto("/admin/new");
  await expect(page.getByText(/Starting from/)).toBeVisible();

  await page.fill('input[name="version"]', `2026.2-e2e-${Date.now()}`);
  await page.fill('input[name="effectiveFrom"]', "2026-02-01");
  await page.fill('input[name="socsoRates.0.employeeContribution"]', "99.99");

  await page.getByRole("button", { name: "Create configuration" }).click();
  await expect(page.getByText("Created.")).toBeVisible();

  // The old calculation stays pinned to the config version in effect when
  // it was saved, even though that config's effectiveTo has now been
  // capped by the "also retire" checkbox.
  await page.goto(beforeUrl);
  await expect(page.getByText("RM 39.75").first()).toBeVisible();

  // A calculation for a month covered by the new config picks up its rate.
  await saveCalculation(page, "2026-03", "3000");
  await expect(page.getByText("RM 99.99").first()).toBeVisible();
});
