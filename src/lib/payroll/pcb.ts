import type { Money, PayrollConfigSnapshot, ResidencyStatus } from "./types";

export interface PCBInput {
  projectedAnnualChargeableIncome: Money;
  residencyStatus: ResidencyStatus;
  previousCumulativePcbPaid: Money;
  monthsElapsedInYear: number;
  monthsRemainingInYear: number;
  zakatAmount: Money; // rebate against PCB, not a relief
  bonusOrIrregularPayment: Money | null; // triggers separate lump-sum PCB method if present
  config: Pick<PayrollConfigSnapshot, "taxBrackets" | "taxRebates">;
}

export interface PCBResult {
  annualTaxPayable: Money;
  monthlyPcbBeforeRebates: Money;
  rebatesApplied: Array<{ code: string; amount: Money }>;
  currentMonthPcb: Money; // final PCB to withhold this month, cumulative-method reconciled
  bracketApplied: { from: Money; to: Money | null; ratePercent: Money } | null;
}

/** Computes Potongan Cukai Bulanan (monthly tax deduction) using the cumulative method against projected annual chargeable income, applying rebates including zakat. */
export function calculatePCB(_input: PCBInput): PCBResult {
  throw new Error("Not implemented — Phase 2");
}
