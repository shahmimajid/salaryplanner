import Decimal from "decimal.js";
import {
  calculateSavingsAllocation,
  type SavingsAllocationRequest,
} from "@/lib/payroll/savings-allocation";
import { roundMoney, roundRate } from "@/lib/payroll/rounding";
import type { AllocationType, SavingsCategory } from "@/lib/payroll/types";
import {
  SAVINGS_CATEGORIES,
  SAVINGS_CATEGORY_META,
} from "@/components/calculator/savings-category-meta";

export interface SummarizeSavingsPlanInput {
  /** SalaryCalculationViewModel.netSalary (a decimal string). */
  netSalary: string;
  /** SalaryCalculationViewModel.weekendSupport.netAdditionalIncome. */
  netWeekendSupportIncome: string;
  saveAllNetWeekendSupport: boolean;
  monthlySavingsTarget: number | undefined;
  allocations: Record<
    SavingsCategory,
    { allocationType: AllocationType; amount: number; percentage: number }
  >;
}

export interface SavingsPlanSummaryViewModel {
  totalNetSalary: string;
  totalCommittedExpenses: string;
  availableBalance: string;
  isOverAllocated: boolean;
  savingsAmount: string;
  savingsPercentage: string;
  weekendSupportContribution: string;
  targetAchieved: boolean | null;
  projectedAnnualSavings: string;
  allocations: Array<{ category: SavingsCategory; computedAmount: string }>;
}

function money(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * Pure client-side wrapper around calculateSavingsAllocation: converts the
 * UI's plain-number form values to Decimal, calls the engine, then adds the
 * EXPENSE/SAVINGS classification and derived figures spec §6 needs (total
 * committed expenses, savings %, target-achieved, projected annual) — all
 * presentation logic, not part of the engine's contract.
 */
export function summarizeSavingsPlan(
  input: SummarizeSavingsPlanInput,
): SavingsPlanSummaryViewModel {
  const netSalary = new Decimal(input.netSalary);
  const netWeekendSupportIncome = new Decimal(input.netWeekendSupportIncome);

  const requests: SavingsAllocationRequest[] = SAVINGS_CATEGORIES.map(
    (category) => {
      const entry = input.allocations[category];
      return {
        category,
        allocationType: entry.allocationType,
        amount:
          entry.allocationType === "FIXED_AMOUNT"
            ? new Decimal(entry.amount)
            : null,
        percentage:
          entry.allocationType === "PERCENTAGE"
            ? new Decimal(entry.percentage)
            : null,
      };
    },
  );

  const result = calculateSavingsAllocation({
    netSalary,
    netWeekendSupportIncome,
    saveAllNetWeekendSupport: input.saveAllNetWeekendSupport,
    requests,
  });

  const totalCommittedExpenses = result.allocations
    .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "EXPENSE")
    .reduce((sum, a) => sum.plus(a.computedAmount), new Decimal(0));

  const savingsAmountDecimal = result.allocations
    .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "SAVINGS")
    .reduce((sum, a) => sum.plus(a.computedAmount), new Decimal(0));

  const savingsPercentage = netSalary.gt(0)
    ? savingsAmountDecimal.div(netSalary).times(100)
    : new Decimal(0);

  const weekendSupportContribution =
    result.allocations.find((a) => a.category === "WEEKEND_SUPPORT_SAVINGS")
      ?.computedAmount ?? new Decimal(0);

  const targetAchieved =
    input.monthlySavingsTarget === undefined
      ? null
      : savingsAmountDecimal.gte(input.monthlySavingsTarget);

  const projectedAnnualSavings = savingsAmountDecimal.times(12);

  return {
    totalNetSalary: money(netSalary),
    totalCommittedExpenses: money(roundMoney(totalCommittedExpenses)),
    availableBalance: money(result.unallocatedRemainder),
    isOverAllocated: result.unallocatedRemainder.lt(0),
    savingsAmount: money(roundMoney(savingsAmountDecimal)),
    savingsPercentage: roundRate(savingsPercentage).toFixed(3),
    weekendSupportContribution: money(weekendSupportContribution),
    targetAchieved,
    projectedAnnualSavings: money(roundMoney(projectedAnnualSavings)),
    allocations: result.allocations.map((a) => ({
      category: a.category,
      computedAmount: money(a.computedAmount),
    })),
  };
}
