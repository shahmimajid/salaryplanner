import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateGrossIncome } from "./gross-income";

const d = (n: number) => new Decimal(n);

describe("calculateGrossIncome", () => {
  it("sums taxable and non-taxable income separately, and combines both into the total", () => {
    const result = calculateGrossIncome({
      basicSalary: d(19088),
      fixedAllowance: d(500),
      weekendSupportAllowance: d(1000),
      bonus: d(0),
      commission: d(0),
      overtime: d(0),
      otherTaxableIncome: d(200),
      otherNonTaxableReimbursement: d(150),
    });

    expect(result.grossTaxableIncome.toString()).toBe("20788");
    expect(result.grossNonTaxableIncome.toString()).toBe("150");
    expect(result.grossIncomeTotal.toString()).toBe("20938");
  });

  it("handles all-zero input", () => {
    const zero = d(0);
    const result = calculateGrossIncome({
      basicSalary: zero,
      fixedAllowance: zero,
      weekendSupportAllowance: zero,
      bonus: zero,
      commission: zero,
      overtime: zero,
      otherTaxableIncome: zero,
      otherNonTaxableReimbursement: zero,
    });
    expect(result.grossIncomeTotal.toString()).toBe("0");
  });

  it("rounds fractional-sen precision to 2dp", () => {
    const result = calculateGrossIncome({
      basicSalary: d(19088.005),
      fixedAllowance: d(0),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      commission: d(0),
      overtime: d(0),
      otherTaxableIncome: d(0),
      otherNonTaxableReimbursement: d(0),
    });
    expect(result.grossTaxableIncome.toString()).toBe("19088.01");
  });

  it("includes overtime in taxable income (it's excluded only from the EPF wage base, see run-pipeline.ts)", () => {
    const result = calculateGrossIncome({
      basicSalary: d(19388),
      fixedAllowance: d(0),
      weekendSupportAllowance: d(0),
      bonus: d(0),
      commission: d(0),
      overtime: d(1920),
      otherTaxableIncome: d(0),
      otherNonTaxableReimbursement: d(0),
    });
    expect(result.grossTaxableIncome.toString()).toBe("21308");
  });
});
