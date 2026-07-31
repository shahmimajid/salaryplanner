import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateNetSalary } from "./net-salary";

const d = (n: number) => new Decimal(n);

describe("calculateNetSalary", () => {
  it("sums deductions and subtracts them from gross to get net salary", () => {
    const result = calculateNetSalary({
      grossSalary: d(20088),
      epfEmployee: d(2099.68),
      socsoEmployee: d(39.75),
      eisEmployee: d(39.5),
      pcb: d(2000),
      zakat: d(0),
      otherDeductions: d(0),
    });

    expect(result.totalDeductions.toString()).toBe("4178.93");
    expect(result.netSalary.toString()).toBe("15909.07");
  });

  it("keeps effective deduction% and take-home% complementary (sum to 100)", () => {
    // Clean numbers (25% deducted exactly) so both percentages round without ambiguity.
    const result = calculateNetSalary({
      grossSalary: d(10000),
      epfEmployee: d(2500),
      socsoEmployee: d(0),
      eisEmployee: d(0),
      pcb: d(0),
      zakat: d(0),
      otherDeductions: d(0),
    });

    expect(result.effectiveDeductionRatePercent.toString()).toBe("25");
    expect(result.effectiveTakeHomePercent.toString()).toBe("75");
    const sum = result.effectiveDeductionRatePercent.plus(
      result.effectiveTakeHomePercent,
    );
    expect(sum.toString()).toBe("100");
  });

  it("guards against a zero gross salary", () => {
    const result = calculateNetSalary({
      grossSalary: d(0),
      epfEmployee: d(0),
      socsoEmployee: d(0),
      eisEmployee: d(0),
      pcb: d(0),
      zakat: d(0),
      otherDeductions: d(0),
    });

    expect(result.effectiveDeductionRatePercent.toString()).toBe("0");
    expect(result.effectiveTakeHomePercent.toString()).toBe("0");
  });
});
