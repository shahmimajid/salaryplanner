import { prisma } from "@/lib/db/prisma";
import { dateToPayrollMonth } from "@/lib/utils/date";
import { SAVINGS_CATEGORY_META } from "@/components/calculator/savings-category-meta";

export interface SalaryEntryExportRow {
  payrollMonth: string;
  basicSalary: string;
  weekendSupportAllowance: string;
  grossSalary: string;
  epf: string;
  socso: string;
  eis: string;
  pcb: string;
  zakat: string;
  totalDeductions: string;
  netSalary: string;
  netWeekendSupportIncome: string;
  effectiveDeductionRatePercent: string;
  totalSavings: string;
}

/**
 * Full per-month column set for CSV export — a superset of both
 * listSalaryEntries' summary (list rendering) and listMonthlySeries' chart
 * shape, so kept as its own query rather than overloading either.
 */
export async function listSalaryEntriesForExport(
  userId: string,
  year?: number,
): Promise<SalaryEntryExportRow[]> {
  const entries = await prisma.salaryEntry.findMany({
    where: {
      userId,
      ...(year
        ? {
            payrollMonth: {
              gte: new Date(Date.UTC(year, 0, 1)),
              lt: new Date(Date.UTC(year + 1, 0, 1)),
            },
          }
        : {}),
    },
    orderBy: { payrollMonth: "asc" },
    select: {
      payrollMonth: true,
      basicSalary: true,
      weekendSupportAllowance: true,
      calculations: {
        where: { isCurrent: true },
        take: 1,
        select: {
          grossSalary: true,
          epfEmployee: true,
          socsoEmployee: true,
          eisEmployee: true,
          pcb: true,
          zakat: true,
          totalDeductions: true,
          netSalary: true,
          netWeekendSupportIncome: true,
          effectiveDeductionRatePercent: true,
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
        basicSalary: entry.basicSalary.toString(),
        weekendSupportAllowance: entry.weekendSupportAllowance.toString(),
        grossSalary: calc.grossSalary.toString(),
        epf: calc.epfEmployee.toString(),
        socso: calc.socsoEmployee.toString(),
        eis: calc.eisEmployee.toString(),
        pcb: calc.pcb.toString(),
        zakat: calc.zakat.toString(),
        totalDeductions: calc.totalDeductions.toString(),
        netSalary: calc.netSalary.toString(),
        netWeekendSupportIncome: calc.netWeekendSupportIncome.toString(),
        effectiveDeductionRatePercent: calc.effectiveDeductionRatePercent.toString(),
        totalSavings: totalSavings.toFixed(2),
      };
    });
}
