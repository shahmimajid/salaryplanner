import Decimal from "decimal.js";
import { calculateGrossIncome, type GrossIncomeResult } from "./gross-income";
import { calculateEPF, type EPFResult } from "./epf";
import { calculateSOCSO, type SOCSOResult } from "./socso";
import { calculateEIS, type EISResult } from "./eis";
import {
  calculateAnnualTaxableIncome,
  type AnnualTaxableIncomeResult,
} from "./tax-annual-income";
import { calculatePCB, type PCBResult } from "./pcb";
import { calculateNetSalary, type NetSalaryResult } from "./net-salary";
import {
  calculateWeekendSupportNet,
  resolveWeekendSupportGrossAmount,
  type WeekendSupportResult,
} from "./weekend-support";
import type {
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
  SocsoCategory,
  WeekendSupportPaymentMethod,
} from "./types";

/**
 * Composes the 8 statutory calculation functions in the order a caller
 * needs them: gross income -> EPF/SOCSO/EIS -> annualized taxable income
 * -> PCB -> net salary. Framework-agnostic and Prisma-free — the caller
 * supplies an already-resolved config/profile (see
 * src/lib/payroll/config/load-local-config.ts for the local-mode source).
 */
export interface SalaryPipelineInput {
  basicSalary: Money;
  fixedAllowance: Money;
  weekendSupportAllowance: Money;
  bonus: Money;
  commission: Money;
  otherTaxableIncome: Money;
  otherNonTaxableReimbursement: Money;
  epfAdjustment: Money;
  zakat: Money;
  previousCumulativeIncomeForYear: Money;
  previousCumulativePcbPaid: Money;
  monthsElapsedInYear: number;
  isEisExempt: boolean;
  profile: PayrollProfileSnapshot;
  config: PayrollConfigSnapshot;
}

export interface SalaryPipelineResult {
  gross: GrossIncomeResult;
  epf: EPFResult;
  socso: SOCSOResult;
  eis: EISResult;
  annualIncome: AnnualTaxableIncomeResult;
  pcb: PCBResult;
  netSalary: NetSalaryResult;
}

export function runSalaryPipeline(
  input: SalaryPipelineInput,
): SalaryPipelineResult {
  const gross = calculateGrossIncome({
    basicSalary: input.basicSalary,
    fixedAllowance: input.fixedAllowance,
    weekendSupportAllowance: input.weekendSupportAllowance,
    bonus: input.bonus,
    commission: input.commission,
    otherTaxableIncome: input.otherTaxableIncome,
    otherNonTaxableReimbursement: input.otherNonTaxableReimbursement,
  });

  const epfWage = gross.grossTaxableIncome; // bonus included in EPF wage
  const socsoEisWage = gross.grossTaxableIncome.minus(input.bonus); // bonus excluded

  const epf = calculateEPF({
    epfWage,
    profile: {
      citizenshipStatus: input.profile.citizenshipStatus,
      epfEmployeeRatePercent: input.profile.epfEmployeeRatePercent,
      isBelow60: input.profile.isBelow60,
    },
    config: input.config,
    epfAdjustment: input.epfAdjustment,
  });

  const socsoCategory: SocsoCategory = input.profile.isBelow60
    ? "CATEGORY_1"
    : "CATEGORY_2";
  const socso = calculateSOCSO({
    socsoWage: socsoEisWage,
    category: socsoCategory,
    config: input.config,
  });
  const eis = calculateEIS({
    eisWage: socsoEisWage,
    isEisExempt: input.isEisExempt,
    config: input.config,
  });

  const monthsRemainingInYear = 12 - input.monthsElapsedInYear;

  const annualIncome = calculateAnnualTaxableIncome({
    currentMonthGrossTaxableIncome: gross.grossTaxableIncome.minus(input.bonus),
    currentMonthEpfEmployee: epf.employeeContribution,
    previousCumulativeIncomeForYear: input.previousCumulativeIncomeForYear,
    monthsRemainingInYear,
    profile: input.profile,
    config: input.config,
  });

  const pcb = calculatePCB({
    projectedAnnualChargeableIncome:
      annualIncome.projectedAnnualChargeableIncome,
    residencyStatus: input.profile.residencyStatus,
    previousCumulativePcbPaid: input.previousCumulativePcbPaid,
    monthsElapsedInYear: input.monthsElapsedInYear,
    monthsRemainingInYear,
    zakatAmount: input.zakat,
    bonusOrIrregularPayment: input.bonus.gt(0) ? input.bonus : null,
    config: input.config,
  });

  const netSalary = calculateNetSalary({
    grossSalary: gross.grossIncomeTotal,
    epfEmployee: epf.employeeContribution,
    socsoEmployee: socso.employeeContribution,
    eisEmployee: eis.employeeContribution,
    pcb: pcb.currentMonthPcb,
    zakat: input.zakat,
    // No "other deductions" salary-entry field exists yet — always zero
    // in this pass; revisit if/when SalaryEntry grows one.
    otherDeductions: new Decimal(0),
  });

  return { gross, epf, socso, eis, annualIncome, pcb, netSalary };
}

/**
 * Full salary-entry orchestration: resolves the weekend-support gross
 * amount, runs the pipeline once without weekend support and once with
 * it, and diffs the two via calculateWeekendSupportNet — everything a
 * salary-entry form needs in one call.
 */
export interface CalculateSalaryEntryInput {
  basicSalary: Money;
  fixedAllowance: Money;
  weekendSupportPaymentMethod: WeekendSupportPaymentMethod;
  weekendSupportFixedRatePerDay: Money | null;
  weekendSupportDaysCount: number | null;
  weekendSupportFixedMonthlyAmount: Money | null;
  weekendSupportManualTotalAmount: Money | null;
  bonus: Money;
  commission: Money;
  otherTaxableIncome: Money;
  otherNonTaxableReimbursement: Money;
  epfAdjustment: Money;
  zakat: Money;
  previousCumulativeIncomeForYear: Money;
  previousCumulativePcbPaid: Money;
  /** "YYYY-MM" — matches an HTML <input type="month"> value. */
  payrollMonth: string;
  profile: PayrollProfileSnapshot;
  config: PayrollConfigSnapshot;
}

export interface CalculateSalaryEntryResult {
  withWeekendSupport: SalaryPipelineResult;
  withoutWeekendSupport: SalaryPipelineResult;
  weekendSupport: WeekendSupportResult;
  monthsElapsedInYear: number;
}

export function calculateSalaryEntry(
  input: CalculateSalaryEntryInput,
): CalculateSalaryEntryResult {
  const [, monthPart] = input.payrollMonth.split("-");
  const monthsElapsedInYear = Number(monthPart) - 1; // "01" (January) -> 0 elapsed

  const weekendSupportAllowance = resolveWeekendSupportGrossAmount({
    paymentMethod: input.weekendSupportPaymentMethod,
    fixedRatePerDay: input.weekendSupportFixedRatePerDay,
    weekendDaysCount: input.weekendSupportDaysCount,
    fixedMonthlyAmount: input.weekendSupportFixedMonthlyAmount,
    manualTotalAmount: input.weekendSupportManualTotalAmount,
  });

  const commonInput = {
    basicSalary: input.basicSalary,
    fixedAllowance: input.fixedAllowance,
    bonus: input.bonus,
    commission: input.commission,
    otherTaxableIncome: input.otherTaxableIncome,
    otherNonTaxableReimbursement: input.otherNonTaxableReimbursement,
    epfAdjustment: input.epfAdjustment,
    zakat: input.zakat,
    previousCumulativeIncomeForYear: input.previousCumulativeIncomeForYear,
    previousCumulativePcbPaid: input.previousCumulativePcbPaid,
    monthsElapsedInYear,
    isEisExempt: false, // no exemption data source yet (docs/assumptions.md)
    profile: input.profile,
    config: input.config,
  };

  const withoutWeekendSupport = runSalaryPipeline({
    ...commonInput,
    weekendSupportAllowance: new Decimal(0),
  });
  const withWeekendSupport = runSalaryPipeline({
    ...commonInput,
    weekendSupportAllowance,
  });

  const weekendSupport = calculateWeekendSupportNet({
    paymentMethod: input.weekendSupportPaymentMethod,
    fixedRatePerDay: input.weekendSupportFixedRatePerDay,
    weekendDaysCount: input.weekendSupportDaysCount,
    fixedMonthlyAmount: input.weekendSupportFixedMonthlyAmount,
    manualTotalAmount: input.weekendSupportManualTotalAmount,
    grossSalaryWithoutWeekendSupport:
      withoutWeekendSupport.gross.grossIncomeTotal,
    netSalaryWithoutWeekendSupport: withoutWeekendSupport.netSalary.netSalary,
    netSalaryWithWeekendSupport: withWeekendSupport.netSalary.netSalary,
  });

  return {
    withWeekendSupport,
    withoutWeekendSupport,
    weekendSupport,
    monthsElapsedInYear,
  };
}
