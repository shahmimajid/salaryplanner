import { test, expect, type Page } from "@playwright/test";

/**
 * DetailRow renders <div><span>label</span><span>value</span></div>. Finds
 * the row whose label span's text starts with `label` and returns its
 * value span's text — robust against the same label appearing in multiple
 * DetailRow instances elsewhere on the page (e.g. tooltips nested inside
 * the label span), unlike chained text/xpath locators.
 */
async function detailRowValue(
  page: Page,
  label: string,
  occurrence = 0,
): Promise<string | null> {
  return page.evaluate(
    ({ label, occurrence }) => {
      const rows = Array.from(
        document.querySelectorAll("div.flex.items-baseline.justify-between"),
      );
      const matches = rows.filter((row) =>
        row.children[0]?.textContent?.trim().startsWith(label),
      );
      const row = matches[occurrence];
      return row ? (row.children[1]?.textContent ?? null) : null;
    },
    { label, occurrence },
  );
}

test("plans savings and sees a live-computed dashboard after a calculation", async ({
  page,
}) => {
  await page.goto("/");

  await page.fill('input[name="basicSalary"]', "19088");
  await page.fill('input[name="weekendSupportManualTotalAmount"]', "1000");
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(page.getByText("Deduction breakdown").first()).toBeVisible();

  const netWeekendSupportOnResults = await detailRowValue(
    page,
    "Net weekend-support amount",
    0,
  );
  expect(netWeekendSupportOnResults).toMatch(/RM\s?[\d,]+\.\d{2}/);

  await page.fill('input[name="allocations.HOUSING.amount"]', "3000");

  const generalSavingsRow = page
    .locator("div.border-input.grid.gap-2.rounded-lg.border.p-3")
    .filter({ hasText: "General savings" });
  await generalSavingsRow.locator('button[value="PERCENTAGE"]').click();
  await page.fill('input[name="allocations.GENERAL_SAVINGS.percentage"]', "10");

  await page.locator("#save-all-weekend-support").click();

  await expect
    .poll(async () =>
      detailRowValue(page, "Amount contributed by weekend support"),
    )
    .toBe(netWeekendSupportOnResults);

  await expect
    .poll(async () => detailRowValue(page, "Savings amount"))
    .toMatch(/RM\s?[\d,]+\.\d{2}/);

  await expect(page.getByText("Dashboard", { exact: true })).toBeVisible();
  await expect(page.getByText("Current gross salary")).toBeVisible();
  await expect(
    page.getByText("Gross salary vs net salary").first(),
  ).toBeVisible();
});
