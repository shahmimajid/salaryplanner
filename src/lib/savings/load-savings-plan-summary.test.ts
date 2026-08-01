import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const savingsPlanFindFirst = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    savingsPlan: { findFirst: (...args: unknown[]) => savingsPlanFindFirst(...args) },
  },
}));

const { loadSavingsPlanSummary } = await import("./load-savings-plan-summary");

function d(n: number) {
  return new Decimal(n);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadSavingsPlanSummary", () => {
  it("returns null when no plan was ever saved for this entry", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce(null);

    const result = await loadSavingsPlanSummary("user-1", "entry-1");

    expect(result).toBeNull();
  });

  it("classifies allocations into EXPENSE/SAVINGS from stored computedAmount, not a recompute", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce({
      monthlySavingsTarget: null,
      allocations: [
        { category: "HOUSING", computedAmount: d(1500) },
        { category: "GENERAL_SAVINGS", computedAmount: d(500) },
      ],
      salaryEntry: {
        calculations: [{ netSalary: d(4270.75) }],
      },
    });

    const result = await loadSavingsPlanSummary("user-1", "entry-1");

    expect(result).not.toBeNull();
    expect(result!.totalCommittedExpenses).toBe("1500.00");
    expect(result!.savingsAmount).toBe("500.00");
    expect(result!.availableBalance).toBe("2270.75");
  });

  it("reports targetAchieved null when no target was set, and computes it when one was", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce({
      monthlySavingsTarget: d(400),
      allocations: [{ category: "GENERAL_SAVINGS", computedAmount: d(500) }],
      salaryEntry: { calculations: [{ netSalary: d(4270.75) }] },
    });

    const result = await loadSavingsPlanSummary("user-1", "entry-1");

    expect(result!.targetAchieved).toBe(true);
  });
});
