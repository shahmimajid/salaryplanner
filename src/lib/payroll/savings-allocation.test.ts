import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSavingsAllocation } from "./savings-allocation";

const d = (n: number) => new Decimal(n);

describe("calculateSavingsAllocation", () => {
  it("sums fixed-amount allocations", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(15000),
      netWeekendSupportIncome: d(0),
      saveAllNetWeekendSupport: false,
      requests: [
        {
          category: "HOUSING",
          allocationType: "FIXED_AMOUNT",
          amount: d(3000),
          percentage: null,
        },
        {
          category: "FOOD",
          allocationType: "FIXED_AMOUNT",
          amount: d(1500),
          percentage: null,
        },
      ],
    });
    expect(result.totalAllocated.toString()).toBe("4500");
    expect(result.unallocatedRemainder.toString()).toBe("10500");
  });

  it("sums percentage-of-net-salary allocations", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(10000),
      netWeekendSupportIncome: d(0),
      saveAllNetWeekendSupport: false,
      requests: [
        {
          category: "GENERAL_SAVINGS",
          allocationType: "PERCENTAGE",
          amount: null,
          percentage: d(20),
        },
        {
          category: "EMERGENCY_FUND",
          allocationType: "PERCENTAGE",
          amount: null,
          percentage: d(10),
        },
      ],
    });
    expect(result.totalAllocated.toString()).toBe("3000");
    expect(result.unallocatedRemainder.toString()).toBe("7000");
  });

  it("mixes fixed and percentage allocations", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(10000),
      netWeekendSupportIncome: d(0),
      saveAllNetWeekendSupport: false,
      requests: [
        {
          category: "HOUSING",
          allocationType: "FIXED_AMOUNT",
          amount: d(2000),
          percentage: null,
        },
        {
          category: "GENERAL_SAVINGS",
          allocationType: "PERCENTAGE",
          amount: null,
          percentage: d(10),
        },
      ],
    });
    expect(result.totalAllocated.toString()).toBe("3000");
  });

  it("forces the WEEKEND_SUPPORT_SAVINGS entry when saveAllNetWeekendSupport is set, overriding its own request", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(15723.45),
      netWeekendSupportIncome: d(723.45),
      saveAllNetWeekendSupport: true,
      requests: [
        {
          category: "WEEKEND_SUPPORT_SAVINGS",
          allocationType: "PERCENTAGE",
          amount: null,
          percentage: d(50), // ignored — overridden
        },
      ],
    });
    const entry = result.allocations.find(
      (a) => a.category === "WEEKEND_SUPPORT_SAVINGS",
    )!;
    expect(entry.computedAmount.toString()).toBe("723.45");
  });

  it("synthesizes a WEEKEND_SUPPORT_SAVINGS entry when none was requested", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(15723.45),
      netWeekendSupportIncome: d(723.45),
      saveAllNetWeekendSupport: true,
      requests: [],
    });
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].category).toBe("WEEKEND_SUPPORT_SAVINGS");
    expect(result.allocations[0].computedAmount.toString()).toBe("723.45");
  });

  it("surfaces overallocation as a negative remainder rather than clipping", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(1000),
      netWeekendSupportIncome: d(0),
      saveAllNetWeekendSupport: false,
      requests: [
        {
          category: "HOUSING",
          allocationType: "FIXED_AMOUNT",
          amount: d(1500),
          percentage: null,
        },
      ],
    });
    expect(result.unallocatedRemainder.toString()).toBe("-500");
  });

  it("handles an empty request list", () => {
    const result = calculateSavingsAllocation({
      netSalary: d(1000),
      netWeekendSupportIncome: d(0),
      saveAllNetWeekendSupport: false,
      requests: [],
    });
    expect(result.allocations).toEqual([]);
    expect(result.totalAllocated.toString()).toBe("0");
    expect(result.unallocatedRemainder.toString()).toBe("1000");
  });
});
