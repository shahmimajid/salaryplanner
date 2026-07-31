import type { Money, PayrollConfigSnapshot } from "./types";

export interface EISInput {
  eisWage: Money; // wage subject to EIS, capped at statutory ceiling
  isEisExempt: boolean; // e.g. age at first registration exemption, civil servants
  config: Pick<PayrollConfigSnapshot, "eisRates">;
}

export interface EISResult {
  employeeContribution: Money;
  employerContribution: Money;
  wageBandApplied: { from: Money; to: Money | null } | null;
}

/** Looks up the EIS contribution band for the wage and returns employee + employer amounts, or zero if exempt. */
export function calculateEIS(_input: EISInput): EISResult {
  throw new Error("Not implemented — Phase 2");
}
