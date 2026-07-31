import type {
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
} from "./types";

export interface AnnualTaxableIncomeInput {
  currentMonthGrossTaxableIncome: Money;
  currentMonthEpfEmployee: Money; // deductible up to relief cap
  previousCumulativeIncomeForYear: Money;
  monthsRemainingInYear: number; // for projecting annualized income
  profile: PayrollProfileSnapshot;
  config: Pick<PayrollConfigSnapshot, "taxReliefs">;
}

export interface AnnualTaxableIncomeResult {
  projectedAnnualGrossIncome: Money;
  totalReliefsApplied: Money;
  projectedAnnualChargeableIncome: Money;
  reliefBreakdown: Array<{ code: string; amountApplied: Money }>;
}

/** Projects full-year chargeable income (gross minus applicable reliefs) used as the PCB calculation base. */
export function calculateAnnualTaxableIncome(
  _input: AnnualTaxableIncomeInput,
): AnnualTaxableIncomeResult {
  throw new Error("Not implemented — Phase 2");
}
