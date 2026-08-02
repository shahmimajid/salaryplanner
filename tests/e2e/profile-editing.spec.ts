import { test, expect, type Page } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

async function signUp(page: Page): Promise<string> {
  const email = uniqueEmail("profile");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}

test("pre-fills the default profile and persists an edit", async ({ page }) => {
  await signUp(page);
  await page.goto("/profile");

  await expect(page.getByRole("radio", { name: "Married" })).toBeChecked();
  await expect(page.locator('input[name="numberOfChildren"]')).toHaveValue("4");
  await expect(page.locator('input[name="epfEmployeeRatePercent"]')).toHaveValue("11");

  await page.fill('input[name="epfEmployeeRatePercent"]', "9");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await page.reload();
  await expect(page.locator('input[name="epfEmployeeRatePercent"]')).toHaveValue("9");
});

test("growing and shrinking numberOfChildren adds/removes relief-claim rows", async ({ page }) => {
  await signUp(page);
  await page.goto("/profile");

  await expect(page.getByText("Child 4 — below 18")).toBeVisible();
  await expect(page.getByText("Child 5 — below 18")).toHaveCount(0);

  await page.fill('input[name="numberOfChildren"]', "2");
  await expect(page.getByText("Child 3 — below 18")).toHaveCount(0);
  await expect(page.getByText("Child 2 — below 18")).toBeVisible();

  await page.fill('input[name="numberOfChildren"]', "5");
  await expect(page.getByText("Child 5 — below 18")).toBeVisible();
  await expect(
    page.locator('input[name="childReliefClaims.4.reliefPercentageClaimed"]'),
  ).toHaveValue("100");
});

test("editing the profile never changes a past calculation, only future ones", async ({ page }) => {
  await signUp(page);

  // Save a calculation under the default profile (EPF 11%).
  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();
  await page.getByRole("link", { name: "View in history" }).click();
  await expect(page).toHaveURL(/\/history\/[^/]+$/);
  await expect(page.getByText("RM 550.00").first()).toBeVisible(); // EPF at 11% of 5000
  const historyUrl = page.url();

  // Change the profile's EPF rate to something visibly different.
  await page.goto("/profile");
  await page.fill('input[name="epfEmployeeRatePercent"]', "5");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // The already-saved calculation is unaffected.
  await page.goto(historyUrl);
  await expect(page.getByText("RM 550.00").first()).toBeVisible();

  // A new calculation for a different month picks up the new rate.
  await page.goto("/dashboard");
  await page
    .locator('input[name="payrollMonth"]')
    .evaluate((el: HTMLInputElement, value: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, "2026-02");
  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();
  await page.getByRole("link", { name: "View in history" }).click();
  await expect(page.getByText("RM 250.00").first()).toBeVisible(); // EPF at 5% of 5000
});
