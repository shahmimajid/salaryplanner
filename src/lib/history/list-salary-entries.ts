import { prisma } from "@/lib/db/prisma";
import { dateToPayrollMonth } from "@/lib/utils/date";

export interface SalaryEntrySummary {
  id: string;
  payrollMonth: string;
  grossSalary: string;
  netSalary: string;
  calculatedAt: Date;
}

/**
 * Fast list render straight from the stored SalaryCalculation figures —
 * no engine recompute needed for N rows (unlike loadCalculationDetail,
 * which recomputes for the single-record detail view).
 */
export async function listSalaryEntries(userId: string): Promise<SalaryEntrySummary[]> {
  const entries = await prisma.salaryEntry.findMany({
    where: { userId },
    orderBy: { payrollMonth: "desc" },
    select: {
      id: true,
      payrollMonth: true,
      calculations: {
        where: { isCurrent: true },
        take: 1,
        select: { grossSalary: true, netSalary: true, calculatedAt: true },
      },
    },
  });

  return entries
    .filter((entry) => entry.calculations.length > 0)
    .map((entry) => ({
      id: entry.id,
      payrollMonth: dateToPayrollMonth(entry.payrollMonth),
      grossSalary: entry.calculations[0].grossSalary.toString(),
      netSalary: entry.calculations[0].netSalary.toString(),
      calculatedAt: entry.calculations[0].calculatedAt,
    }));
}
