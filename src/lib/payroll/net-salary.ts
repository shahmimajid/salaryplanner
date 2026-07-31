import Decimal from "decimal.js";
import type { Money } from "./types";
import { roundMoney, roundRate } from "./rounding";

export interface NetSalaryInput {
  grossSalary: Money;
  epfEmployee: Money;
  socsoEmployee: Money;
  eisEmployee: Money;
  pcb: Money;
  zakat: Money;
  otherDeductions: Money;
}

export interface NetSalaryResult {
  totalDeductions: Money;
  netSalary: Money;
  effectiveDeductionRatePercent: Money;
  effectiveTakeHomePercent: Money;
}

/** Aggregates all deduction components into totals and derives the effective deduction/take-home percentages for a payroll month. */
export function calculateNetSalary(input: NetSalaryInput): NetSalaryResult {
  const {
    grossSalary,
    epfEmployee,
    socsoEmployee,
    eisEmployee,
    pcb,
    zakat,
    otherDeductions,
  } = input;

  const totalDeductions = epfEmployee
    .plus(socsoEmployee)
    .plus(eisEmployee)
    .plus(pcb)
    .plus(zakat)
    .plus(otherDeductions);

  const netSalary = grossSalary.minus(totalDeductions);

  const effectiveDeductionRatePercent = grossSalary.gt(0)
    ? totalDeductions.div(grossSalary).times(100)
    : new Decimal(0);
  const effectiveTakeHomePercent = grossSalary.gt(0)
    ? netSalary.div(grossSalary).times(100)
    : new Decimal(0);

  return {
    totalDeductions: roundMoney(totalDeductions),
    netSalary: roundMoney(netSalary),
    effectiveDeductionRatePercent: roundRate(effectiveDeductionRatePercent),
    effectiveTakeHomePercent: roundRate(effectiveTakeHomePercent),
  };
}
