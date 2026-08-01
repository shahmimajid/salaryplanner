import { describe, expect, it, vi, beforeEach } from "vitest";
import Decimal from "decimal.js";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";

const savingsPlanFindFirst = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    savingsPlan: { findFirst: (...args: unknown[]) => savingsPlanFindFirst(...args) },
  },
}));

const { loadSavingsPlanFormValues } = await import("./load-savings-plan");

function d(n: number) {
  return new Decimal(n);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadSavingsPlanFormValues", () => {
  it("returns null when no plan has been saved for this entry", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce(null);

    const result = await loadSavingsPlanFormValues("user-1", "entry-1");

    expect(result).toBeNull();
  });

  it("maps stored allocation rows back into form shape", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce({
      monthlySavingsTarget: d(1000),
      saveAllNetWeekendSupport: true,
      allocations: [
        { category: "GENERAL_SAVINGS", allocationType: "FIXED_AMOUNT", amount: d(500), percentage: null },
        { category: "HOUSING", allocationType: "PERCENTAGE", amount: null, percentage: d(20) },
      ],
    });

    const result = await loadSavingsPlanFormValues("user-1", "entry-1");

    expect(result).not.toBeNull();
    expect(result!.monthlySavingsTarget).toBe(1000);
    expect(result!.saveAllNetWeekendSupport).toBe(true);
    expect(result!.allocations.GENERAL_SAVINGS).toEqual({
      allocationType: "FIXED_AMOUNT",
      amount: 500,
      percentage: 0,
    });
    expect(result!.allocations.HOUSING).toEqual({
      allocationType: "PERCENTAGE",
      amount: 0,
      percentage: 20,
    });
  });

  it("defaults any category missing a stored allocation row", async () => {
    savingsPlanFindFirst.mockResolvedValueOnce({
      monthlySavingsTarget: null,
      saveAllNetWeekendSupport: false,
      allocations: [],
    });

    const result = await loadSavingsPlanFormValues("user-1", "entry-1");

    expect(result).not.toBeNull();
    expect(result!.monthlySavingsTarget).toBeUndefined();
    for (const category of SAVINGS_CATEGORIES) {
      expect(result!.allocations[category]).toEqual({
        allocationType: "FIXED_AMOUNT",
        amount: 0,
        percentage: 0,
      });
    }
  });
});
