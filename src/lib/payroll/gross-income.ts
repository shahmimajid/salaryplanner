import type { Money } from "./types";
import { roundMoney } from "./rounding";

export interface GrossIncomeInput {
  basicSalary: Money;
  fixedAllowance: Money;
  weekendSupportAllowance: Money;
  bonus: Money;
  commission: Money;
  overtime: Money;
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
  input: GrossIncomeInput,
): GrossIncomeResult {
  const grossTaxableIncome = input.basicSalary
    .plus(input.fixedAllowance)
    .plus(input.weekendSupportAllowance)
    .plus(input.bonus)
    .plus(input.commission)
    .plus(input.overtime)
    .plus(input.otherTaxableIncome);

  const grossNonTaxableIncome = input.otherNonTaxableReimbursement;

  const grossIncomeTotal = grossTaxableIncome.plus(grossNonTaxableIncome);

  return {
    grossTaxableIncome: roundMoney(grossTaxableIncome),
    grossNonTaxableIncome: roundMoney(grossNonTaxableIncome),
    grossIncomeTotal: roundMoney(grossIncomeTotal),
  };
}
