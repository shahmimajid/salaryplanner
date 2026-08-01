import { prisma } from "@/lib/db/prisma";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";
import {
  defaultSavingsPlannerValues,
  type SavingsPlannerFormValues,
} from "@/components/calculator/savings-schema";

/**
 * Hydrates the savings planner form from a previously-saved plan. Returns
 * null if no plan has been saved for this entry yet (not an error — most
 * entries won't have one). Any category missing a stored allocation row
 * (e.g. a plan saved before that category existed) falls back to that
 * category's own default, keeping this forward-compatible with schema
 * additions.
 */
export async function loadSavingsPlanFormValues(
  userId: string,
  salaryEntryId: string,
): Promise<SavingsPlannerFormValues | null> {
  const plan = await prisma.savingsPlan.findFirst({
    where: { userId, salaryEntryId },
    include: { allocations: true },
  });
  if (!plan) return null;

  const defaults = defaultSavingsPlannerValues();
  const allocationByCategory = new Map(
    plan.allocations.map((a) => [a.category, a]),
  );

  return {
    monthlySavingsTarget: plan.monthlySavingsTarget
      ? Number(plan.monthlySavingsTarget)
      : undefined,
    saveAllNetWeekendSupport: plan.saveAllNetWeekendSupport,
    allocations: SAVINGS_CATEGORIES.reduce(
      (values, category) => {
        const row = allocationByCategory.get(category);
        values[category] = row
          ? {
              allocationType: row.allocationType,
              amount: row.amount ? Number(row.amount) : 0,
              percentage: row.percentage ? Number(row.percentage) : 0,
            }
          : defaults.allocations[category];
        return values;
      },
      {} as SavingsPlannerFormValues["allocations"],
    ),
  };
}
