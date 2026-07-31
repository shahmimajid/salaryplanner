import type {
  Money,
  PayrollConfigSnapshot,
  PayrollProfileSnapshot,
} from "./types";

export interface EPFInput {
  epfWage: Money; // wage subject to EPF (typically basic + fixed allowance + certain payments, excl. some allowances)
  profile: Pick<
    PayrollProfileSnapshot,
    "citizenshipStatus" | "epfEmployeeRatePercent"
  >;
  config: Pick<PayrollConfigSnapshot, "epfRates" | "epfWageBands">;
  epfAdjustment: Money; // manual override/adjustment from SalaryEntry.epfAdjustment
}

export interface EPFResult {
  employeeContribution: Money;
  employerContribution: Money;
  appliedRatePercent: Money;
  appliedWageBandUsed: boolean; // true if resolved via table lookup rather than pure percentage
}

/** Resolves EPF employee/employer contribution for a wage using rate % or wage-band table lookup, applying any manual adjustment. */
export function calculateEPF(_input: EPFInput): EPFResult {
  throw new Error("Not implemented — Phase 2");
}
