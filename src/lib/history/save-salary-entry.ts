import Decimal from "decimal.js";
import { prisma } from "@/lib/db/prisma";
import { resolveConfig } from "@/lib/payroll/config/resolve-config";
import { toPayrollProfileSnapshot } from "@/lib/payroll/config/profile-snapshot";
import { calculateSalaryEntry, deriveZakat } from "@/lib/payroll/run-pipeline";
import {
  toSalaryCalculationViewModel,
  type SalaryCalculationViewModel,
} from "@/components/calculator/to-view-model";
import { salaryEntryFormSchema, type SalaryEntryFormValues } from "@/components/calculator/schema";
import { payrollMonthToDate } from "@/lib/utils/date";

export type SaveSalaryEntryResult =
  | { ok: true; salaryEntryId: string; data: SalaryCalculationViewModel }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

function toMoney(value: number | undefined): Decimal {
  return new Decimal(value ?? 0);
}

function toMoneyOrNull(value: number | undefined): Decimal | null {
  return value === undefined ? null : new Decimal(value);
}

/**
 * Validates, calculates (against the user's persisted profile + the active
 * DB-backed payroll config), and persists a salary entry. Same user + same
 * payrollMonth updates the existing SalaryEntry in place and supersedes
 * the previous SalaryCalculation (isCurrent=false) rather than duplicating
 * — uses the schema's isCurrent flag exactly as designed for in Phase 1.
 */
export async function saveSalaryEntry(
  userId: string,
  input: SalaryEntryFormValues,
): Promise<SaveSalaryEntryResult> {
  const parsed = salaryEntryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  const profileRow = await prisma.payrollProfile.findUniqueOrThrow({ where: { userId } });
  const profile = toPayrollProfileSnapshot(profileRow);
  const config = await resolveConfig({ effectiveDate: `${value.payrollMonth}-01` });
  if (!config.id) {
    throw new Error("resolveConfig did not resolve a database-backed configuration id.");
  }

  const engineResult = calculateSalaryEntry({
    basicSalary: toMoney(value.basicSalary),
    fixedAllowance: toMoney(value.fixedAllowance),
    weekendSupportPaymentMethod: value.weekendSupportPaymentMethod,
    weekendSupportFixedRatePerDay: toMoneyOrNull(value.weekendSupportFixedRatePerDay),
    weekendSupportDaysCount: value.weekendSupportDaysCount ?? null,
    weekendSupportFixedMonthlyAmount: toMoneyOrNull(value.weekendSupportFixedMonthlyAmount),
    weekendSupportManualTotalAmount: toMoneyOrNull(value.weekendSupportManualTotalAmount),
    bonus: toMoney(value.bonus),
    commission: toMoney(value.commission),
    otherTaxableIncome: toMoney(value.otherTaxableIncome),
    otherNonTaxableReimbursement: toMoney(value.otherNonTaxableReimbursement),
    epfAdjustment: toMoney(value.epfAdjustment),
    zakat: toMoney(value.zakat),
    previousCumulativeIncomeForYear: toMoney(value.previousCumulativeIncomeForYear),
    previousCumulativePcbPaid: toMoney(value.previousCumulativePcbPaid),
    payrollMonth: value.payrollMonth,
    profile,
    config,
  });

  const w = engineResult.withWeekendSupport;
  const zakat = deriveZakat(w);
  const payrollMonthDate = payrollMonthToDate(value.payrollMonth);

  const entryData = {
    basicSalary: value.basicSalary.toString(),
    fixedAllowance: value.fixedAllowance.toString(),
    // The canonical gross weekend-support figure regardless of payment
    // method — for FIXED_MONTHLY/MANUAL_TOTAL this equals the entered
    // amount directly; for FIXED_PER_DAY it's rate*days, already resolved
    // by the engine.
    weekendSupportAllowance: engineResult.weekendSupport.weekendSupportGrossAmount.toString(),
    weekendSupportPaymentMethod: value.weekendSupportPaymentMethod,
    weekendSupportDaysCount: value.weekendSupportDaysCount ?? null,
    weekendSupportRatePerDay: value.weekendSupportFixedRatePerDay?.toString() ?? null,
    bonus: value.bonus.toString(),
    commission: value.commission.toString(),
    otherTaxableIncome: value.otherTaxableIncome.toString(),
    otherNonTaxableReimbursement: value.otherNonTaxableReimbursement.toString(),
    epfAdjustment: value.epfAdjustment.toString(),
    zakat: value.zakat.toString(),
    previousCumulativeIncomeForYear: value.previousCumulativeIncomeForYear.toString(),
    previousCumulativePcbPaid: value.previousCumulativePcbPaid.toString(),
    notes: value.notes ?? null,
  };

  const salaryEntryId = await prisma.$transaction(async (tx) => {
    const existing = await tx.salaryEntry.findFirst({
      where: { userId, payrollMonth: payrollMonthDate },
    });

    const entry = existing
      ? await tx.salaryEntry.update({ where: { id: existing.id }, data: entryData })
      : await tx.salaryEntry.create({
          data: { userId, payrollMonth: payrollMonthDate, ...entryData },
        });

    if (existing) {
      await tx.salaryCalculation.updateMany({
        where: { salaryEntryId: entry.id, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    await tx.salaryCalculation.create({
      data: {
        salaryEntryId: entry.id,
        payrollConfigurationId: config.id!,
        grossSalary: w.gross.grossIncomeTotal.toString(),
        epfEmployee: w.epf.employeeContribution.toString(),
        socsoEmployee: w.socso.employeeContribution.toString(),
        eisEmployee: w.eis.employeeContribution.toString(),
        pcb: w.pcb.currentMonthPcb.toString(),
        zakat: zakat.toString(),
        otherDeductions: "0",
        totalDeductions: w.netSalary.totalDeductions.toString(),
        netSalary: w.netSalary.netSalary.toString(),
        netWeekendSupportIncome:
          engineResult.weekendSupport.netAdditionalIncomeFromWeekendSupport.toString(),
        effectiveDeductionRatePercent: w.netSalary.effectiveDeductionRatePercent.toString(),
        effectiveTakeHomePercent: w.netSalary.effectiveTakeHomePercent.toString(),
        isCurrent: true,
        deductionBreakdowns: {
          create: [
            {
              category: "EPF_EMPLOYEE",
              label: "EPF (employee)",
              amount: w.epf.employeeContribution.toString(),
            },
            {
              category: "SOCSO_EMPLOYEE",
              label: "SOCSO (employee)",
              amount: w.socso.employeeContribution.toString(),
            },
            {
              category: "EIS_EMPLOYEE",
              label: "EIS (employee)",
              amount: w.eis.employeeContribution.toString(),
            },
            { category: "PCB", label: "PCB (income tax)", amount: w.pcb.currentMonthPcb.toString() },
            { category: "ZAKAT", label: "Zakat", amount: zakat.toString() },
          ],
        },
      },
    });

    return entry.id;
  });

  return { ok: true, salaryEntryId, data: toSalaryCalculationViewModel(engineResult) };
}
