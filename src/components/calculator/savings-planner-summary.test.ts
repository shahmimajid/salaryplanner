import { describe, expect, it } from "vitest";
import {
  summarizeSavingsPlan,
  type SummarizeSavingsPlanInput,
} from "./savings-planner-summary";
import { defaultSavingsPlannerValues } from "./savings-schema";

function baseInput(
  overrides?: Partial<SummarizeSavingsPlanInput>,
): SummarizeSavingsPlanInput {
  return {
    netSalary: "10000.00",
    netWeekendSupportIncome: "0.00",
    saveAllNetWeekendSupport: false,
    monthlySavingsTarget: undefined,
    allocations: defaultSavingsPlannerValues().allocations,
    ...overrides,
  };
}

describe("summarizeSavingsPlan", () => {
  it("classifies expense vs savings categories into separate totals", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.HOUSING = {
      allocationType: "FIXED_AMOUNT",
      amount: 3000,
      percentage: 0,
    };
    allocations.GENERAL_SAVINGS = {
      allocationType: "FIXED_AMOUNT",
      amount: 1500,
      percentage: 0,
    };

    const result = summarizeSavingsPlan(baseInput({ allocations }));

    expect(result.totalCommittedExpenses).toBe("3000.00");
    expect(result.savingsAmount).toBe("1500.00");
    expect(result.availableBalance).toBe("5500.00");
    expect(result.isOverAllocated).toBe(false);
  });

  it("computes savings percentage relative to net salary", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.GENERAL_SAVINGS = {
      allocationType: "PERCENTAGE",
      amount: 0,
      percentage: 20,
    };

    const result = summarizeSavingsPlan(baseInput({ allocations }));

    expect(result.savingsAmount).toBe("2000.00");
    expect(result.savingsPercentage).toBe("20.000");
  });

  it("projects annual savings as 12x the monthly savings amount", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.EMERGENCY_FUND = {
      allocationType: "FIXED_AMOUNT",
      amount: 500,
      percentage: 0,
    };

    const result = summarizeSavingsPlan(baseInput({ allocations }));

    expect(result.projectedAnnualSavings).toBe("6000.00");
  });

  it("returns null targetAchieved when no target is set, true/false otherwise", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.GENERAL_SAVINGS = {
      allocationType: "FIXED_AMOUNT",
      amount: 1000,
      percentage: 0,
    };

    const noTarget = summarizeSavingsPlan(baseInput({ allocations }));
    expect(noTarget.targetAchieved).toBeNull();

    const achieved = summarizeSavingsPlan(
      baseInput({ allocations, monthlySavingsTarget: 800 }),
    );
    expect(achieved.targetAchieved).toBe(true);

    const notAchieved = summarizeSavingsPlan(
      baseInput({ allocations, monthlySavingsTarget: 1500 }),
    );
    expect(notAchieved.targetAchieved).toBe(false);
  });

  it("extracts the weekend-support contribution independent of the save-all toggle", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.WEEKEND_SUPPORT_SAVINGS = {
      allocationType: "FIXED_AMOUNT",
      amount: 200,
      percentage: 0,
    };

    const manual = summarizeSavingsPlan(
      baseInput({ allocations, netWeekendSupportIncome: "640.00" }),
    );
    expect(manual.weekendSupportContribution).toBe("200.00");

    const forced = summarizeSavingsPlan(
      baseInput({
        allocations,
        netWeekendSupportIncome: "640.00",
        saveAllNetWeekendSupport: true,
      }),
    );
    expect(forced.weekendSupportContribution).toBe("640.00");
  });

  it("surfaces overallocation as a negative available balance", () => {
    const allocations = defaultSavingsPlannerValues().allocations;
    allocations.HOUSING = {
      allocationType: "FIXED_AMOUNT",
      amount: 8000,
      percentage: 0,
    };
    allocations.CAR = {
      allocationType: "FIXED_AMOUNT",
      amount: 3000,
      percentage: 0,
    };

    const result = summarizeSavingsPlan(baseInput({ allocations }));

    expect(result.isOverAllocated).toBe(true);
    expect(result.availableBalance).toBe("-1000.00");
  });
});
