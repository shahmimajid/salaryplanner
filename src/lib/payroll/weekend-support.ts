import Decimal from "decimal.js";
import type { Money, WeekendSupportPaymentMethod } from "./types";
import { roundMoney, roundRate } from "./rounding";

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

function resolveGrossAmount(input: WeekendSupportInput): Money {
  switch (input.paymentMethod) {
    case "FIXED_PER_DAY":
      if (input.fixedRatePerDay === null || input.weekendDaysCount === null) {
        throw new Error(
          "FIXED_PER_DAY payment method requires fixedRatePerDay and weekendDaysCount.",
        );
      }
      return input.fixedRatePerDay.times(input.weekendDaysCount);
    case "FIXED_MONTHLY":
      if (input.fixedMonthlyAmount === null) {
        throw new Error(
          "FIXED_MONTHLY payment method requires fixedMonthlyAmount.",
        );
      }
      return input.fixedMonthlyAmount;
    case "MANUAL_TOTAL":
      if (input.manualTotalAmount === null) {
        throw new Error(
          "MANUAL_TOTAL payment method requires manualTotalAmount.",
        );
      }
      return input.manualTotalAmount;
  }
}

/**
 * Computes the weekend-support allowance gross amount per the chosen
 * payment method, and its true net contribution after marginal
 * EPF/SOCSO/EIS/PCB impact. This function performs no deduction math
 * itself — the caller is expected to run the full calculation pipeline
 * twice (once with weekendSupportAllowance = 0, once with the real value)
 * and pass both resulting net salaries in; this function is pure delta
 * arithmetic on those two already-computed results (comparison mode reuses
 * it per scenario).
 */
export function calculateWeekendSupportNet(
  input: WeekendSupportInput,
): WeekendSupportResult {
  const weekendSupportGrossAmount = resolveGrossAmount(input);

  const netAdditionalIncomeFromWeekendSupport =
    input.netSalaryWithWeekendSupport.minus(
      input.netSalaryWithoutWeekendSupport,
    );

  const effectiveMarginalDeductionRatePercent = weekendSupportGrossAmount.gt(0)
    ? new Decimal(1)
        .minus(
          netAdditionalIncomeFromWeekendSupport.div(weekendSupportGrossAmount),
        )
        .times(100)
    : new Decimal(0);

  return {
    weekendSupportGrossAmount: roundMoney(weekendSupportGrossAmount),
    netAdditionalIncomeFromWeekendSupport: roundMoney(
      netAdditionalIncomeFromWeekendSupport,
    ),
    effectiveMarginalDeductionRatePercent: roundRate(
      effectiveMarginalDeductionRatePercent,
    ),
  };
}
