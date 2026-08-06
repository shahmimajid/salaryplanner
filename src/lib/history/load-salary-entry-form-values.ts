import { prisma } from "@/lib/db/prisma";
import { dateToPayrollMonth } from "@/lib/utils/date";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { WeekendSupportPaymentMethod } from "@/lib/payroll/types";

/**
 * Returns the raw, editable SalaryEntryFormValues for a saved entry —
 * distinct from loadCalculationDetail, which returns a recomputed display
 * view model. Reconstructs the same weekend-support field mapping
 * loadCalculationDetail uses (the schema only stores the resolved gross
 * amount + optional per-day fields, not all 3 method-specific sub-fields).
 * Null (not found or not owned) mirrors loadCalculationDetail's convention.
 */
export async function loadSalaryEntryFormValues(
  userId: string,
  salaryEntryId: string,
): Promise<SalaryEntryFormValues | null> {
  const entry = await prisma.salaryEntry.findFirst({
    where: { id: salaryEntryId, userId },
  });
  if (!entry) return null;

  const method = (entry.weekendSupportPaymentMethod ?? "MANUAL_TOTAL") as WeekendSupportPaymentMethod;
  const weekendSupportAllowance = Number(entry.weekendSupportAllowance);

  return {
    payrollMonth: dateToPayrollMonth(entry.payrollMonth),
    basicSalary: Number(entry.basicSalary),
    fixedAllowance: Number(entry.fixedAllowance),
    weekendSupportPaymentMethod: method,
    weekendSupportFixedRatePerDay:
      method === "FIXED_PER_DAY" && entry.weekendSupportRatePerDay
        ? Number(entry.weekendSupportRatePerDay)
        : undefined,
    weekendSupportDaysCount:
      method === "FIXED_PER_DAY" ? (entry.weekendSupportDaysCount ?? undefined) : undefined,
    weekendSupportFixedMonthlyAmount:
      method === "FIXED_MONTHLY" ? weekendSupportAllowance : undefined,
    weekendSupportManualTotalAmount:
      method === "MANUAL_TOTAL" ? weekendSupportAllowance : undefined,
    bonus: Number(entry.bonus),
    commission: Number(entry.commission),
    overtime: Number(entry.overtime),
    otherTaxableIncome: Number(entry.otherTaxableIncome),
    otherNonTaxableReimbursement: Number(entry.otherNonTaxableReimbursement),
    epfAdjustment: Number(entry.epfAdjustment),
    zakat: Number(entry.zakat),
    previousCumulativeIncomeForYear: Number(entry.previousCumulativeIncomeForYear),
    previousCumulativePcbPaid: Number(entry.previousCumulativePcbPaid),
    previousCumulativeEpfForYear: Number(entry.previousCumulativeEpfForYear),
    notes: entry.notes ?? undefined,
  };
}
