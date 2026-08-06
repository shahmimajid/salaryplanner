"use server";

import Decimal from "decimal.js";
import {
  salaryEntryFormSchema,
  type SalaryEntryFormValues,
} from "@/components/calculator/schema";
import { calculateSalaryEntry } from "@/lib/payroll/run-pipeline";
import { loadLocalPayrollConfig } from "@/lib/payroll/config/load-local-config";
import { DEFAULT_PAYROLL_PROFILE } from "@/lib/payroll/config/default-profile";
import {
  toSalaryCalculationViewModel,
  type SalaryCalculationViewModel,
} from "@/components/calculator/to-view-model";

export type CalculateSalaryActionResult =
  | { ok: true; data: SalaryCalculationViewModel }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

function toMoney(value: number | undefined): Decimal {
  return new Decimal(value ?? 0);
}

function toMoneyOrNull(value: number | undefined): Decimal | null {
  return value === undefined ? null : new Decimal(value);
}

export async function calculateSalaryAction(
  input: SalaryEntryFormValues,
): Promise<CalculateSalaryActionResult> {
  // Never trust client-side validation alone — re-validate server-side.
  const parsed = salaryEntryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  const config = loadLocalPayrollConfig();

  const result = calculateSalaryEntry({
    basicSalary: toMoney(value.basicSalary),
    fixedAllowance: toMoney(value.fixedAllowance),
    weekendSupportPaymentMethod: value.weekendSupportPaymentMethod,
    weekendSupportFixedRatePerDay: toMoneyOrNull(
      value.weekendSupportFixedRatePerDay,
    ),
    weekendSupportDaysCount: value.weekendSupportDaysCount ?? null,
    weekendSupportFixedMonthlyAmount: toMoneyOrNull(
      value.weekendSupportFixedMonthlyAmount,
    ),
    weekendSupportManualTotalAmount: toMoneyOrNull(
      value.weekendSupportManualTotalAmount,
    ),
    bonus: toMoney(value.bonus),
    commission: toMoney(value.commission),
    overtime: toMoney(value.overtime),
    otherTaxableIncome: toMoney(value.otherTaxableIncome),
    otherNonTaxableReimbursement: toMoney(value.otherNonTaxableReimbursement),
    epfAdjustment: toMoney(value.epfAdjustment),
    zakat: toMoney(value.zakat),
    previousCumulativeIncomeForYear: toMoney(
      value.previousCumulativeIncomeForYear,
    ),
    previousCumulativePcbPaid: toMoney(value.previousCumulativePcbPaid),
    previousCumulativeEpfForYear: toMoney(value.previousCumulativeEpfForYear),
    // value.payrollMonth is already "YYYY-MM" (native <input type="month"> value).
    payrollMonth: value.payrollMonth,
    profile: DEFAULT_PAYROLL_PROFILE,
    config,
  });

  return { ok: true, data: toSalaryCalculationViewModel(result) };
}
