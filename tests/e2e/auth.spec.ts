import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test("signs up, lands on the dashboard, and can sign out", async ({ page }) => {
  const email = uniqueEmail("signup");

  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  // Signed-in header shows the account nav instead of Sign in/Sign up.
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("rejects an invalid sign-in with a generic error message", async ({ page }) => {
  await page.goto("/signin");
  await page.fill('input[name="email"]', uniqueEmail("nonexistent"));
  await page.fill('input[name="password"]', "whatever-wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/signin$/);
});

test("redirects an unauthenticated visitor away from protected routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=/);

  await page.goto("/history");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=/);
});
