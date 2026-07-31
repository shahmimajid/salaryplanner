import { test, expect } from "@playwright/test";

test("landing page shows title and disclaimer", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "My Net Salary Planner" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Verify final payroll deductions/i),
  ).toBeVisible();
});
