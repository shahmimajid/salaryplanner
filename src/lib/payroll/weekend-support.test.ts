import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateWeekendSupportNet } from "./weekend-support";

const d = (n: number) => new Decimal(n);

describe("calculateWeekendSupportNet", () => {
  it("computes gross for FIXED_PER_DAY", () => {
    const result = calculateWeekendSupportNet({
      paymentMethod: "FIXED_PER_DAY",
      fixedRatePerDay: d(125),
      weekendDaysCount: 8,
      fixedMonthlyAmount: null,
      manualTotalAmount: null,
      grossSalaryWithoutWeekendSupport: d(19088),
      netSalaryWithoutWeekendSupport: d(15000),
      netSalaryWithWeekendSupport: d(15640),
    });
    expect(result.weekendSupportGrossAmount.toString()).toBe("1000");
  });

  it("computes gross for FIXED_MONTHLY", () => {
    const result = calculateWeekendSupportNet({
      paymentMethod: "FIXED_MONTHLY",
      fixedRatePerDay: null,
      weekendDaysCount: null,
      fixedMonthlyAmount: d(1000),
      manualTotalAmount: null,
      grossSalaryWithoutWeekendSupport: d(19088),
      netSalaryWithoutWeekendSupport: d(15000),
      netSalaryWithWeekendSupport: d(15640),
    });
    expect(result.weekendSupportGrossAmount.toString()).toBe("1000");
  });

  it("computes gross for MANUAL_TOTAL", () => {
    const result = calculateWeekendSupportNet({
      paymentMethod: "MANUAL_TOTAL",
      fixedRatePerDay: null,
      weekendDaysCount: null,
      fixedMonthlyAmount: null,
      manualTotalAmount: d(1000),
      grossSalaryWithoutWeekendSupport: d(19088),
      netSalaryWithoutWeekendSupport: d(15000),
      netSalaryWithWeekendSupport: d(15640),
    });
    expect(result.weekendSupportGrossAmount.toString()).toBe("1000");
  });

  it("throws when the field required by the chosen payment method is missing", () => {
    expect(() =>
      calculateWeekendSupportNet({
        paymentMethod: "FIXED_PER_DAY",
        fixedRatePerDay: null,
        weekendDaysCount: null,
        fixedMonthlyAmount: null,
        manualTotalAmount: null,
        grossSalaryWithoutWeekendSupport: d(19088),
        netSalaryWithoutWeekendSupport: d(15000),
        netSalaryWithWeekendSupport: d(15640),
      }),
    ).toThrow(/FIXED_PER_DAY/);
  });

  it("computes net as the delta between the two full-pipeline net salaries (not a flat assumption)", () => {
    // Illustrates the spec §5 example: gross RM1,000 weekend support, but the
    // net contribution comes from real deltas, not a hardcoded RM640.
    const result = calculateWeekendSupportNet({
      paymentMethod: "MANUAL_TOTAL",
      fixedRatePerDay: null,
      weekendDaysCount: null,
      fixedMonthlyAmount: null,
      manualTotalAmount: d(1000),
      grossSalaryWithoutWeekendSupport: d(19088),
      netSalaryWithoutWeekendSupport: d(15000),
      netSalaryWithWeekendSupport: d(15723.45),
    });
    expect(result.netAdditionalIncomeFromWeekendSupport.toString()).toBe(
      "723.45",
    );
    expect(result.effectiveMarginalDeductionRatePercent.toString()).toBe(
      "27.655",
    );
  });

  it("guards against a zero gross amount", () => {
    const result = calculateWeekendSupportNet({
      paymentMethod: "MANUAL_TOTAL",
      fixedRatePerDay: null,
      weekendDaysCount: null,
      fixedMonthlyAmount: null,
      manualTotalAmount: d(0),
      grossSalaryWithoutWeekendSupport: d(19088),
      netSalaryWithoutWeekendSupport: d(15000),
      netSalaryWithWeekendSupport: d(15000),
    });
    expect(result.effectiveMarginalDeductionRatePercent.toString()).toBe("0");
  });
});
