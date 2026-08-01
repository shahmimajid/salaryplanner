import Decimal from "decimal.js";
import { prisma } from "@/lib/db/prisma";
import { roundMoney, roundRate } from "@/lib/payroll/rounding";
import { SAVINGS_CATEGORY_META } from "@/components/calculator/savings-category-meta";
import type { SavingsPlanSummaryViewModel } from "@/components/calculator/savings-planner-summary";

function money(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * Read-only savings summary for a saved plan, for history detail display.
 * Sums the persisted computedAmount columns directly rather than
 * re-running calculateSavingsAllocation — these are simple sums, not
 * statutory formulas that could drift by config version, so (unlike
 * loadCalculationDetail's always-recompute approach) trusting the stored
 * figures here matches listSalaryEntries' own convention. Returns null if
 * no plan was ever saved for this entry.
 */
export async function loadSavingsPlanSummary(
  userId: string,
  salaryEntryId: string,
): Promise<SavingsPlanSummaryViewModel | null> {
  const plan = await prisma.savingsPlan.findFirst({
    where: { userId, salaryEntryId },
    include: {
      allocations: true,
      salaryEntry: {
        include: { calculations: { where: { isCurrent: true }, take: 1 } },
      },
    },
  });
  if (!plan) return null;

  const calculation = plan.salaryEntry?.calculations[0];
  const netSalary = new Decimal(calculation?.netSalary.toString() ?? "0");

  const totalCommittedExpenses = plan.allocations
    .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "EXPENSE")
    .reduce((sum, a) => sum.plus(a.computedAmount?.toString() ?? "0"), new Decimal(0));

  const savingsAmountDecimal = plan.allocations
    .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "SAVINGS")
    .reduce((sum, a) => sum.plus(a.computedAmount?.toString() ?? "0"), new Decimal(0));

  const totalAllocated = totalCommittedExpenses.plus(savingsAmountDecimal);
  const unallocatedRemainder = netSalary.minus(totalAllocated);

  const savingsPercentage = netSalary.gt(0)
    ? savingsAmountDecimal.div(netSalary).times(100)
    : new Decimal(0);

  const weekendSupportContribution = new Decimal(
    plan.allocations.find((a) => a.category === "WEEKEND_SUPPORT_SAVINGS")
      ?.computedAmount?.toString() ?? "0",
  );

  const targetAchieved = plan.monthlySavingsTarget
    ? savingsAmountDecimal.gte(plan.monthlySavingsTarget.toString())
    : null;

  return {
    totalNetSalary: money(netSalary),
    totalCommittedExpenses: money(roundMoney(totalCommittedExpenses)),
    availableBalance: money(unallocatedRemainder),
    isOverAllocated: unallocatedRemainder.lt(0),
    savingsAmount: money(roundMoney(savingsAmountDecimal)),
    savingsPercentage: roundRate(savingsPercentage).toFixed(3),
    weekendSupportContribution: money(weekendSupportContribution),
    targetAchieved,
    projectedAnnualSavings: money(roundMoney(savingsAmountDecimal.times(12))),
    allocations: plan.allocations.map((a) => ({
      category: a.category,
      computedAmount: money(new Decimal(a.computedAmount?.toString() ?? "0")),
    })),
  };
}
