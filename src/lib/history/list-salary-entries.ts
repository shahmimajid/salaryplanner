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

/**
 * In-memory filter/year-list over an already-fetched list — deliberate
 * simplification since per-user history is small (bounded by
 * months-since-signup), avoiding a second DB round-trip or a raw
 * EXTRACT(YEAR ...) query filter. Revisit if entry counts ever grow large
 * enough for that tradeoff to matter.
 */
export function filterEntriesByYear(
  entries: SalaryEntrySummary[],
  year: number,
): SalaryEntrySummary[] {
  return entries.filter((entry) => entry.payrollMonth.startsWith(`${year}-`));
}

export function listAvailableYears(entries: SalaryEntrySummary[]): number[] {
  const years = new Set(entries.map((entry) => Number(entry.payrollMonth.slice(0, 4))));
  return [...years].sort((a, b) => b - a);
}
