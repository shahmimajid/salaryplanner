import Decimal from "decimal.js";
import { prisma } from "@/lib/db/prisma";
import { resolveConfigById } from "@/lib/payroll/config/resolve-config";
import {
  toPayrollProfileSnapshot,
  fromStoredProfileSnapshot,
} from "@/lib/payroll/config/profile-snapshot";
import { calculateSalaryEntry } from "@/lib/payroll/run-pipeline";
import {
  toSalaryCalculationViewModel,
  type SalaryCalculationViewModel,
} from "@/components/calculator/to-view-model";
import { dateToPayrollMonth } from "@/lib/utils/date";
import type { WeekendSupportPaymentMethod } from "@/lib/payroll/types";

export interface CalculationDetail {
  salaryEntryId: string;
  payrollMonth: string;
  data: SalaryCalculationViewModel;
}

/**
 * Recomputes a saved calculation's full view model at view time, rather
 * than storing the with/without-weekend-support comparison pair as extra
 * columns. Reuses toSalaryCalculationViewModel()/ResultsPanel/Dashboard
 * unchanged, so the live-calculate and view-history paths can never
 * silently diverge, and pins to the *exact* PayrollConfiguration version
 * originally used (resolveConfigById, not a date-based re-resolve) —
 * preserving the versioned-config guarantee even if a later config change
 * would otherwise affect what a date lookup returns. Likewise pins to the
 * exact PayrollProfile snapshot in effect when this calculation was
 * saved (SalaryCalculation.profileSnapshot), so a later profile edit
 * can't retroactively change how a past calculation recomputes either.
 * Falls back to the live PayrollProfile row only for calculations saved
 * before that column existed (profileSnapshot null) — harmless, since no
 * profile edits had ever happened by then.
 */
export async function loadCalculationDetail(
  userId: string,
  salaryEntryId: string,
): Promise<CalculationDetail | null> {
  const entry = await prisma.salaryEntry.findFirst({
    where: { id: salaryEntryId, userId },
    include: { calculations: { where: { isCurrent: true }, take: 1 } },
  });
  if (!entry || entry.calculations.length === 0) {
    return null;
  }

  const pinnedProfile = entry.calculations[0].profileSnapshot;
  const profile = pinnedProfile
    ? fromStoredProfileSnapshot(pinnedProfile)
    : toPayrollProfileSnapshot(
        await prisma.payrollProfile.findUniqueOrThrow({ where: { userId } }),
      );
  const config = await resolveConfigById(entry.calculations[0].payrollConfigurationId);

  const method = (entry.weekendSupportPaymentMethod ?? "MANUAL_TOTAL") as WeekendSupportPaymentMethod;
  const weekendSupportAllowance = new Decimal(entry.weekendSupportAllowance.toString());

  const engineResult = calculateSalaryEntry({
    basicSalary: new Decimal(entry.basicSalary.toString()),
    fixedAllowance: new Decimal(entry.fixedAllowance.toString()),
    weekendSupportPaymentMethod: method,
    weekendSupportFixedRatePerDay:
      method === "FIXED_PER_DAY" && entry.weekendSupportRatePerDay
        ? new Decimal(entry.weekendSupportRatePerDay.toString())
        : null,
    weekendSupportDaysCount: method === "FIXED_PER_DAY" ? entry.weekendSupportDaysCount : null,
    weekendSupportFixedMonthlyAmount: method === "FIXED_MONTHLY" ? weekendSupportAllowance : null,
    weekendSupportManualTotalAmount: method === "MANUAL_TOTAL" ? weekendSupportAllowance : null,
    bonus: new Decimal(entry.bonus.toString()),
    commission: new Decimal(entry.commission.toString()),
    otherTaxableIncome: new Decimal(entry.otherTaxableIncome.toString()),
    otherNonTaxableReimbursement: new Decimal(entry.otherNonTaxableReimbursement.toString()),
    epfAdjustment: new Decimal(entry.epfAdjustment.toString()),
    zakat: new Decimal(entry.zakat.toString()),
    previousCumulativeIncomeForYear: new Decimal(entry.previousCumulativeIncomeForYear.toString()),
    previousCumulativePcbPaid: new Decimal(entry.previousCumulativePcbPaid.toString()),
    payrollMonth: dateToPayrollMonth(entry.payrollMonth),
    profile,
    config,
  });

  return {
    salaryEntryId: entry.id,
    payrollMonth: dateToPayrollMonth(entry.payrollMonth),
    data: toSalaryCalculationViewModel(engineResult),
  };
}
