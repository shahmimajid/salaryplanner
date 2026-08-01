import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const salaryEntryFindMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    salaryEntry: { findMany: (...args: unknown[]) => salaryEntryFindMany(...args) },
  },
}));

const { computeAnnualSummary } = await import("./annual-summary");

function d(n: number) {
  return new Decimal(n);
}

function entry({
  basicSalary,
  epf,
  socso,
  eis,
  pcb,
  netSalary,
  rate,
  savingsAmount,
}: {
  basicSalary: number;
  epf: number;
  socso: number;
  eis: number;
  pcb: number;
  netSalary: number;
  rate: number;
  savingsAmount?: number;
}) {
  return {
    basicSalary: d(basicSalary),
    weekendSupportAllowance: d(0),
    calculations: [
      {
        epfEmployee: d(epf),
        socsoEmployee: d(socso),
        eisEmployee: d(eis),
        pcb: d(pcb),
        netSalary: d(netSalary),
        effectiveDeductionRatePercent: d(rate),
      },
    ],
    savingsPlans:
      savingsAmount === undefined
        ? []
        : [
            {
              allocations: [
                { category: "GENERAL_SAVINGS", computedAmount: d(savingsAmount) },
              ],
            },
          ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("computeAnnualSummary", () => {
  it("sums across months and computes an equal-weighted average deduction rate", async () => {
    salaryEntryFindMany.mockResolvedValueOnce([
      entry({ basicSalary: 5000, epf: 550, socso: 39.75, eis: 39.5, pcb: 100, netSalary: 4270.75, rate: 14.585, savingsAmount: 500 }),
      entry({ basicSalary: 6000, epf: 660, socso: 39.75, eis: 39.5, pcb: 200, netSalary: 5060.75, rate: 15.654 }),
    ]);

    const summary = await computeAnnualSummary("user-1", 2026);

    expect(summary.monthCount).toBe(2);
    expect(summary.totalBasicSalary).toBe("11000.00");
    expect(summary.totalEpf).toBe("1210.00");
    expect(summary.totalNetSalary).toBe("9331.50");
    // A month with no saved SavingsPlan contributes 0, not an error.
    expect(summary.totalSavings).toBe("500.00");
    // Equal-weighted mean of 14.585 and 15.654, not income-weighted.
    expect(summary.averageEffectiveDeductionRatePercent).toBe("15.120");
  });

  it("returns zeroed totals for a year with no saved months", async () => {
    salaryEntryFindMany.mockResolvedValueOnce([]);

    const summary = await computeAnnualSummary("user-1", 2025);

    expect(summary.monthCount).toBe(0);
    expect(summary.totalNetSalary).toBe("0.00");
    expect(summary.averageEffectiveDeductionRatePercent).toBe("0.000");
  });
});
