import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";

const salaryEntryFindFirst = vi.fn();
const savingsPlanFindFirst = vi.fn();
const savingsPlanCreate = vi.fn();
const savingsPlanUpdate = vi.fn();
const savingsAllocationDeleteMany = vi.fn();
const savingsAllocationCreateMany = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    salaryEntry: { findFirst: (...args: unknown[]) => salaryEntryFindFirst(...args) },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        savingsPlan: {
          findFirst: (...args: unknown[]) => savingsPlanFindFirst(...args),
          create: (...args: unknown[]) => savingsPlanCreate(...args),
          update: (...args: unknown[]) => savingsPlanUpdate(...args),
        },
        savingsAllocation: {
          deleteMany: (...args: unknown[]) => savingsAllocationDeleteMany(...args),
          createMany: (...args: unknown[]) => savingsAllocationCreateMany(...args),
        },
      }),
  },
}));

const { saveSavingsPlan } = await import("./save-savings-plan");

function d(n: number) {
  return new Decimal(n);
}

const SALARY_ENTRY_ROW = {
  id: "entry-1",
  payrollMonth: new Date("2026-01-01"),
  calculations: [{ netSalary: d(4327.25), netWeekendSupportIncome: d(0) }],
};

function defaultAllocations() {
  return SAVINGS_CATEGORIES.reduce(
    (values, category) => {
      values[category] = { allocationType: "FIXED_AMOUNT" as const, amount: 0, percentage: 0 };
      return values;
    },
    {} as Record<
      (typeof SAVINGS_CATEGORIES)[number],
      { allocationType: "FIXED_AMOUNT" | "PERCENTAGE"; amount: number; percentage: number }
    >,
  );
}

const VALID_INPUT = {
  salaryEntryId: "entry-1",
  saveAllNetWeekendSupport: false,
  monthlySavingsTarget: undefined,
  allocations: {
    ...defaultAllocations(),
    GENERAL_SAVINGS: { allocationType: "FIXED_AMOUNT" as const, amount: 500, percentage: 0 },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  salaryEntryFindFirst.mockResolvedValue(SALARY_ENTRY_ROW);
  savingsPlanCreate.mockResolvedValue({ id: "plan-new" });
  savingsPlanUpdate.mockResolvedValue({ id: "plan-existing" });
});

describe("saveSavingsPlan", () => {
  it("returns field errors and never touches Prisma when validation fails", async () => {
    const result = await saveSavingsPlan("user-1", {
      ...VALID_INPUT,
      allocations: {
        ...VALID_INPUT.allocations,
        GENERAL_SAVINGS: { allocationType: "FIXED_AMOUNT", amount: -1, percentage: 0 },
      },
    });

    expect(result.ok).toBe(false);
    expect(salaryEntryFindFirst).not.toHaveBeenCalled();
  });

  it("rejects a salaryEntryId not owned by the user", async () => {
    salaryEntryFindFirst.mockResolvedValueOnce(null);

    const result = await saveSavingsPlan("user-1", VALID_INPUT);

    expect(result.ok).toBe(false);
    expect(salaryEntryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "entry-1", userId: "user-1" } }),
    );
    expect(savingsPlanCreate).not.toHaveBeenCalled();
  });

  it("creates a new SavingsPlan + allocations when none exists for the entry", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce(null);

    const result = await saveSavingsPlan("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(savingsPlanCreate).toHaveBeenCalledTimes(1);
    expect(savingsPlanUpdate).not.toHaveBeenCalled();
    expect(savingsAllocationDeleteMany).not.toHaveBeenCalled();
    expect(savingsAllocationCreateMany).toHaveBeenCalledTimes(1);
    const createArgs = savingsAllocationCreateMany.mock.calls[0][0];
    expect(createArgs.data).toHaveLength(SAVINGS_CATEGORIES.length);
    expect(createArgs.data.every((row: { savingsPlanId: string }) => row.savingsPlanId === "plan-new")).toBe(
      true,
    );
  });

  it("updates an existing SavingsPlan by wholesale-replacing its allocations", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce({ id: "plan-existing" });

    const result = await saveSavingsPlan("user-1", VALID_INPUT);

    expect(result.ok).toBe(true);
    expect(savingsPlanUpdate).toHaveBeenCalledTimes(1);
    expect(savingsPlanCreate).not.toHaveBeenCalled();
    expect(savingsAllocationDeleteMany).toHaveBeenCalledWith({
      where: { savingsPlanId: "plan-existing" },
    });
    expect(savingsAllocationCreateMany).toHaveBeenCalledTimes(1);
  });

  it("never trusts client-sent amounts — computedAmount comes from the server-side engine call", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce(null);

    await saveSavingsPlan("user-1", VALID_INPUT);

    const createArgs = savingsAllocationCreateMany.mock.calls[0][0];
    const generalSavingsRow = createArgs.data.find(
      (row: { category: string }) => row.category === "GENERAL_SAVINGS",
    );
    expect(generalSavingsRow.computedAmount).toBe("500");
  });
});
