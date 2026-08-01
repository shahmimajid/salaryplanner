import { prisma } from "@/lib/db/prisma";
import { dateToPayrollMonth } from "@/lib/utils/date";
import { SAVINGS_CATEGORY_META } from "@/components/calculator/savings-category-meta";

export interface MonthlySeriesPoint {
  payrollMonth: string;
  grossSalary: string;
  netSalary: string;
  weekendSupportGrossAmount: string;
  weekendSupportNetAmount: string;
  epf: string;
  socso: string;
  eis: string;
  pcb: string;
  zakat: string;
  totalSavings: string;
}

/**
 * One row per saved month across the user's full history (ascending, for
 * chart x-axes), shared by all 3 multi-month dashboard charts rather than
 * three near-identical queries. totalSavings is "0.00" for a month with no
 * saved SavingsPlan — not an error.
 */
export async function listMonthlySeries(userId: string): Promise<MonthlySeriesPoint[]> {
  const entries = await prisma.salaryEntry.findMany({
    where: { userId },
    orderBy: { payrollMonth: "asc" },
    select: {
      payrollMonth: true,
      weekendSupportAllowance: true,
      calculations: {
        where: { isCurrent: true },
        take: 1,
        select: {
          grossSalary: true,
          netSalary: true,
          netWeekendSupportIncome: true,
          epfEmployee: true,
          socsoEmployee: true,
          eisEmployee: true,
          pcb: true,
          zakat: true,
        },
      },
      savingsPlans: { include: { allocations: true } },
    },
  });

  return entries
    .filter((entry) => entry.calculations.length > 0)
    .map((entry) => {
      const calc = entry.calculations[0];
      const totalSavings = entry.savingsPlans
        .flatMap((plan) => plan.allocations)
        .filter((a) => SAVINGS_CATEGORY_META[a.category].group === "SAVINGS")
        .reduce((sum, a) => sum + Number(a.computedAmount ?? 0), 0);

      return {
        payrollMonth: dateToPayrollMonth(entry.payrollMonth),
        grossSalary: calc.grossSalary.toString(),
        netSalary: calc.netSalary.toString(),
        weekendSupportGrossAmount: entry.weekendSupportAllowance.toString(),
        weekendSupportNetAmount: calc.netWeekendSupportIncome.toString(),
        epf: calc.epfEmployee.toString(),
        socso: calc.socsoEmployee.toString(),
        eis: calc.eisEmployee.toString(),
        pcb: calc.pcb.toString(),
        zakat: calc.zakat.toString(),
        totalSavings: totalSavings.toFixed(2),
      };
    });
}
