import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";

const salaryEntryFindMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    salaryEntry: { findMany: (...args: unknown[]) => salaryEntryFindMany(...args) },
  },
}));

const { listMonthlySeries } = await import("./list-monthly-series");

function d(n: number) {
  return new Decimal(n);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listMonthlySeries", () => {
  it("maps one row per saved month, ascending", async () => {
    salaryEntryFindMany.mockResolvedValueOnce([
      {
        payrollMonth: new Date("2026-01-01"),
        weekendSupportAllowance: d(0),
        calculations: [
          {
            grossSalary: d(5000),
            netSalary: d(4270.75),
            netWeekendSupportIncome: d(0),
            epfEmployee: d(550),
            socsoEmployee: d(39.75),
            eisEmployee: d(39.5),
            pcb: d(100),
            zakat: d(0),
          },
        ],
        savingsPlans: [
          {
            allocations: [{ category: "GENERAL_SAVINGS", computedAmount: d(500) }],
          },
        ],
      },
    ]);

    const result = await listMonthlySeries("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].payrollMonth).toBe("2026-01");
    expect(result[0].grossSalary).toBe("5000");
    expect(result[0].totalSavings).toBe("500.00");
  });

  it("excludes entries with no current calculation", async () => {
    salaryEntryFindMany.mockResolvedValueOnce([
      { payrollMonth: new Date("2026-01-01"), weekendSupportAllowance: d(0), calculations: [], savingsPlans: [] },
    ]);

    const result = await listMonthlySeries("user-1");

    expect(result).toEqual([]);
  });

  it("defaults totalSavings to 0.00 for a month with no saved plan", async () => {
    salaryEntryFindMany.mockResolvedValueOnce([
      {
        payrollMonth: new Date("2026-02-01"),
        weekendSupportAllowance: d(0),
        calculations: [
          {
            grossSalary: d(5000),
            netSalary: d(4270.75),
            netWeekendSupportIncome: d(0),
            epfEmployee: d(550),
            socsoEmployee: d(39.75),
            eisEmployee: d(39.5),
            pcb: d(100),
            zakat: d(0),
          },
        ],
        savingsPlans: [],
      },
    ]);

    const result = await listMonthlySeries("user-1");

    expect(result[0].totalSavings).toBe("0.00");
  });
});
