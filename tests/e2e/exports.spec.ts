import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test("downloads a CSV export and a PDF payslip for a saved calculation", async ({ page }) => {
  const email = uniqueEmail("export");
  await page.goto("/signup");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "correct horse battery staple");
  await page.fill('input[name="confirmPassword"]', "correct horse battery staple");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.fill('input[name="basicSalary"]', "5000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Saved for this month.")).toBeVisible();
  await page.getByRole("link", { name: "View in history" }).click();
  await expect(page).toHaveURL(/\/history\/([^/]+)$/);
  const salaryEntryId = page.url().split("/history/")[1];

  // page.request shares the browser context's session cookies, so these
  // are authenticated requests — a lightweight header/byte-length smoke
  // check, not deep content parsing.
  const csvResponse = await page.request.get("/api/export/history");
  expect(csvResponse.ok()).toBe(true);
  expect(csvResponse.headers()["content-type"]).toContain("text/csv");
  const csvBody = await csvResponse.text();
  expect(csvBody).toContain("Payroll month");
  expect(csvBody.length).toBeGreaterThan(0);

  const pdfResponse = await page.request.get(`/api/export/payslip/${salaryEntryId}`);
  expect(pdfResponse.ok()).toBe(true);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
  const pdfBody = await pdfResponse.body();
  expect(pdfBody.length).toBeGreaterThan(0);
});

test("export endpoints redirect an unauthenticated request to sign in", async ({ page }) => {
  const response = await page.request.get("/api/export/history", {
    maxRedirects: 0,
  });
  expect([302, 303, 307].includes(response.status())).toBe(true);
});
