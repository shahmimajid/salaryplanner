import type { Money } from "./types";

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
export function calculateNetSalary(_input: NetSalaryInput): NetSalaryResult {
  throw new Error("Not implemented — Phase 2");
}
