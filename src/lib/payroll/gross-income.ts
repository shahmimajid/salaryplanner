import type { Money } from "./types";

export interface GrossIncomeInput {
  basicSalary: Money;
  fixedAllowance: Money;
  weekendSupportAllowance: Money;
  bonus: Money;
  commission: Money;
  otherTaxableIncome: Money;
  otherNonTaxableReimbursement: Money;
}

export interface GrossIncomeResult {
  grossTaxableIncome: Money;
  grossNonTaxableIncome: Money;
  grossIncomeTotal: Money;
}

/** Sums a SalaryEntry's income fields into taxable/non-taxable/total gross figures. */
export function calculateGrossIncome(
  _input: GrossIncomeInput,
): GrossIncomeResult {
  throw new Error("Not implemented — Phase 2");
}
