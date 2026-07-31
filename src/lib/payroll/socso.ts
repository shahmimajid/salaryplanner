import type { Money, PayrollConfigSnapshot, SocsoCategory } from "./types";

export interface SOCSOInput {
  socsoWage: Money; // wage subject to SOCSO, capped at statutory ceiling
  category: SocsoCategory; // CATEGORY_1 (below 60) or CATEGORY_2 (60+)
  config: Pick<PayrollConfigSnapshot, "socsoRates">;
}

export interface SOCSOResult {
  employeeContribution: Money;
  employerContribution: Money;
  wageBandApplied: { from: Money; to: Money | null };
}

/** Looks up the SOCSO contribution band for the wage/category and returns employee + employer amounts, respecting the wage ceiling. */
export function calculateSOCSO(_input: SOCSOInput): SOCSOResult {
  throw new Error("Not implemented — Phase 2");
}
