import Decimal from "decimal.js";
import { prisma } from "@/lib/db/prisma";
import { calculateSavingsAllocation } from "@/lib/payroll/savings-allocation";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";
import {
  savingsPlanPersistSchema,
  type SavingsPlanPersistInput,
} from "@/components/calculator/savings-schema";
import {
  summarizeSavingsPlan,
  type SavingsPlanSummaryViewModel,
} from "@/components/calculator/savings-planner-summary";

export type SaveSavingsPlanResult =
  | { ok: true; savingsPlanId: string; summary: SavingsPlanSummaryViewModel }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

/**
 * Validates, recomputes server-side (never trusts client-sent amounts), and
 * persists a savings plan for one SalaryEntry. One plan per entry: an
 * existing plan's allocations are wholesale deleted and recreated rather
 * than diffed — the full allocation set is always resubmitted anyway, and
 * diffing 12 category upserts every save buys nothing.
 */
export async function saveSavingsPlan(
  userId: string,
  input: SavingsPlanPersistInput,
): Promise<SaveSavingsPlanResult> {
  const parsed = savingsPlanPersistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  const entry = await prisma.salaryEntry.findFirst({
    where: { id: value.salaryEntryId, userId },
    include: { calculations: { where: { isCurrent: true }, take: 1 } },
  });
  const calculation = entry?.calculations[0];
  if (!entry || !calculation) {
    return {
      ok: false,
      fieldErrors: { salaryEntryId: ["Salary entry not found."] },
    };
  }

  const netSalary = calculation.netSalary.toString();
  const netWeekendSupportIncome = calculation.netWeekendSupportIncome.toString();

  const engineResult = calculateSavingsAllocation({
    netSalary: new Decimal(netSalary),
    netWeekendSupportIncome: new Decimal(netWeekendSupportIncome),
    saveAllNetWeekendSupport: value.saveAllNetWeekendSupport,
    requests: SAVINGS_CATEGORIES.map((category) => {
      const allocation = value.allocations[category];
      return {
        category,
        allocationType: allocation.allocationType,
        amount:
          allocation.allocationType === "FIXED_AMOUNT"
            ? new Decimal(allocation.amount)
            : null,
        percentage:
          allocation.allocationType === "PERCENTAGE"
            ? new Decimal(allocation.percentage)
            : null,
      };
    }),
  });

  const computedAmountByCategory = new Map(
    engineResult.allocations.map((a) => [a.category, a.computedAmount]),
  );

  const savingsPlanId = await prisma.$transaction(async (tx) => {
    const existing = await tx.savingsPlan.findFirst({
      where: { userId, salaryEntryId: entry.id },
    });

    const planData = {
      name: `Savings plan — ${entry.payrollMonth.toISOString().slice(0, 7)}`,
      effectiveMonth: entry.payrollMonth,
      saveAllNetWeekendSupport: value.saveAllNetWeekendSupport,
      monthlySavingsTarget: value.monthlySavingsTarget?.toString() ?? null,
    };

    const plan = existing
      ? await tx.savingsPlan.update({ where: { id: existing.id }, data: planData })
      : await tx.savingsPlan.create({
          data: { userId, salaryEntryId: entry.id, ...planData },
        });

    if (existing) {
      await tx.savingsAllocation.deleteMany({
        where: { savingsPlanId: plan.id },
      });
    }

    await tx.savingsAllocation.createMany({
      data: SAVINGS_CATEGORIES.map((category) => {
        const allocation = value.allocations[category];
        return {
          savingsPlanId: plan.id,
          category,
          allocationType: allocation.allocationType,
          amount:
            allocation.allocationType === "FIXED_AMOUNT"
              ? allocation.amount.toString()
              : null,
          percentage:
            allocation.allocationType === "PERCENTAGE"
              ? allocation.percentage.toString()
              : null,
          computedAmount: (
            computedAmountByCategory.get(category) ?? new Decimal(0)
          ).toString(),
        };
      }),
    });

    return plan.id;
  });

  const summary = summarizeSavingsPlan({
    netSalary,
    netWeekendSupportIncome,
    saveAllNetWeekendSupport: value.saveAllNetWeekendSupport,
    monthlySavingsTarget: value.monthlySavingsTarget,
    allocations: value.allocations,
  });

  return { ok: true, savingsPlanId, summary };
}
