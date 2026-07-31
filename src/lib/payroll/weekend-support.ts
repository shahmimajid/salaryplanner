import type { Money, WeekendSupportPaymentMethod } from "./types";

export interface WeekendSupportInput {
  paymentMethod: WeekendSupportPaymentMethod;
  fixedRatePerDay: Money | null;
  weekendDaysCount: number | null;
  fixedMonthlyAmount: Money | null;
  manualTotalAmount: Money | null;
  // Marginal deduction impact of adding this allowance on top of base salary —
  // needed to isolate "net additional income from weekend support" per spec.
  grossSalaryWithoutWeekendSupport: Money;
  netSalaryWithoutWeekendSupport: Money;
  netSalaryWithWeekendSupport: Money;
}

export interface WeekendSupportResult {
  weekendSupportGrossAmount: Money;
  netAdditionalIncomeFromWeekendSupport: Money; // delta between the two net figures
  effectiveMarginalDeductionRatePercent: Money;
}

/** Computes the weekend-support allowance gross amount per the chosen payment method, and its true net contribution after marginal EPF/SOCSO/EIS/PCB impact (comparison mode reuses this per scenario). */
export function calculateWeekendSupportNet(
  _input: WeekendSupportInput,
): WeekendSupportResult {
  throw new Error("Not implemented — Phase 2");
}
