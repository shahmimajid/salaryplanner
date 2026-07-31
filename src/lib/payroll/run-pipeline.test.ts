import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSalaryEntry } from "./run-pipeline";
import { buildRealisticTestConfig, buildTestProfile } from "./test-fixtures";

const d = (n: number) => new Decimal(n);
const config = buildRealisticTestConfig();
const profile = buildTestProfile();

function baseInput(
  overrides?: Partial<Parameters<typeof calculateSalaryEntry>[0]>,
) {
  return {
    basicSalary: d(19088),
    fixedAllowance: d(0),
    weekendSupportPaymentMethod: "MANUAL_TOTAL" as const,
    weekendSupportFixedRatePerDay: null,
    weekendSupportDaysCount: null,
    weekendSupportFixedMonthlyAmount: null,
    weekendSupportManualTotalAmount: d(0),
    bonus: d(0),
    commission: d(0),
    otherTaxableIncome: d(0),
    otherNonTaxableReimbursement: d(0),
    epfAdjustment: d(0),
    zakat: d(0),
    previousCumulativeIncomeForYear: d(0),
    previousCumulativePcbPaid: d(0),
    payrollMonth: "2026-01",
    profile,
    config,
    ...overrides,
  };
}

describe("calculateSalaryEntry", () => {
  it("derives monthsElapsedInYear from payrollMonth (January = 0 elapsed)", () => {
    const result = calculateSalaryEntry(baseInput({ payrollMonth: "2026-06" }));
    expect(result.monthsElapsedInYear).toBe(5);
  });

  it("produces zero weekend-support gross/net when none is entered", () => {
    const result = calculateSalaryEntry(baseInput());
    expect(result.weekendSupport.weekendSupportGrossAmount.toString()).toBe(
      "0",
    );
    expect(
      result.withWeekendSupport.netSalary.netSalary.lte(
        result.withWeekendSupport.gross.grossIncomeTotal,
      ),
    ).toBe(true);
  });

  it("increases net salary and reports positive net-additional income when weekend support is entered", () => {
    const result = calculateSalaryEntry(
      baseInput({ weekendSupportManualTotalAmount: d(1000) }),
    );
    expect(
      result.withWeekendSupport.netSalary.netSalary.gt(
        result.withoutWeekendSupport.netSalary.netSalary,
      ),
    ).toBe(true);
    expect(
      result.weekendSupport.netAdditionalIncomeFromWeekendSupport.gt(0),
    ).toBe(true);
  });

  it("resolves the FIXED_PER_DAY payment method through to the gross amount", () => {
    const result = calculateSalaryEntry(
      baseInput({
        weekendSupportPaymentMethod: "FIXED_PER_DAY",
        weekendSupportManualTotalAmount: null,
        weekendSupportFixedRatePerDay: d(125),
        weekendSupportDaysCount: 8,
      }),
    );
    expect(result.weekendSupport.weekendSupportGrossAmount.toString()).toBe(
      "1000",
    );
  });
});
