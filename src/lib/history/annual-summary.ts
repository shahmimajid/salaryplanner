import Decimal from "decimal.js";
import { prisma } from "@/lib/db/prisma";
import { roundMoney, roundRate } from "@/lib/payroll/rounding";
import { SAVINGS_CATEGORY_META } from "@/components/calculator/savings-category-meta";

export interface AnnualSummary {
  year: number;
  monthCount: number;
  totalBasicSalary: string;
  totalWeekendSupportAllowance: string;
  totalEpf: string;
  totalSocso: string;
  totalEis: string;
  totalPcb: string;
  totalNetSalary: string;
  totalSavings: string;
  averageEffectiveDeductionRatePercent: string;
}

function money(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * Sums a user's saved months for one calendar year. Average effective
 * deduction rate is equal-weighted per month (mean of each month's own
 * rate), not income-weighted — a deliberate decision, not an oversight
 * (see docs/assumptions.md). Total savings sums every month's
 * SAVINGS-group SavingsAllocation.computedAmount; a month with no saved
 * plan simply contributes 0.
 */
export async function computeAnnualSummary(
  userId: string,
  year: number,
): Promise<AnnualSummary> {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const entries = await prisma.salaryEntry.findMany({
    where: { userId, payrollMonth: { gte: start, lt: end } },
    select: {
      basicSalary: true,
      weekendSupportAllowance: true,
      calculations: {
        where: { isCurrent: true },
        take: 1,
        select: {
          epfEmployee: true,
          socsoEmployee: true,
          eisEmployee: true,
          pcb: true,
          netSalary: true,
          effectiveDeductionRatePercent: true,
        },
      },
      savingsPlans: { include: { allocations: true } },
    },
  });

  const withCalculation = entries.filter((entry) => entry.calculations.length > 0);

  const sum = (values: Decimal[]) =>
    values.reduce((total, value) => total.plus(value), new Decimal(0));

  const totalBasicSalary = sum(withCalculation.map((e) => new Decimal(e.basicSalary.toString())));
  const totalWeekendSupportAllowance = sum(
    withCalculation.map((e) => new Decimal(e.weekendSupportAllowance.toString())),
  );
  const totalEpf = sum(withCalculation.map((e) => new Decimal(e.calculations[0].epfEmployee.toString())));
  const totalSocso = sum(
    withCalculation.map((e) => new Decimal(e.calculations[0].socsoEmployee.toString())),
  );
  const totalEis = sum(withCalculation.map((e) => new Decimal(e.calculations[0].eisEmployee.toString())));
  const totalPcb = sum(withCalculation.map((e) => new Decimal(e.calculations[0].pcb.toString())));
  const totalNetSalary = sum(
    withCalculation.map((e) => new Decimal(e.calculations[0].netSalary.toString())),
  );

  const totalSavings = sum(
    withCalculation.flatMap((e) =>
      e.savingsPlans.flatMap((plan) =>
        plan.allocations
          .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "SAVINGS")
          .map((a) => new Decimal(a.computedAmount?.toString() ?? "0")),
      ),
    ),
  );

  const averageRate =
    withCalculation.length === 0
      ? new Decimal(0)
      : sum(
          withCalculation.map(
            (e) => new Decimal(e.calculations[0].effectiveDeductionRatePercent.toString()),
          ),
        ).div(withCalculation.length);

  return {
    year,
    monthCount: withCalculation.length,
    totalBasicSalary: money(roundMoney(totalBasicSalary)),
    totalWeekendSupportAllowance: money(roundMoney(totalWeekendSupportAllowance)),
    totalEpf: money(roundMoney(totalEpf)),
    totalSocso: money(roundMoney(totalSocso)),
    totalEis: money(roundMoney(totalEis)),
    totalPcb: money(roundMoney(totalPcb)),
    totalNetSalary: money(roundMoney(totalNetSalary)),
    totalSavings: money(roundMoney(totalSavings)),
    averageEffectiveDeductionRatePercent: roundRate(averageRate).toFixed(3),
  };
}
