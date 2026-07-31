import type { PayrollConfigSnapshot } from "../types";

export interface ResolveConfigInput {
  effectiveDate: string; // ISO date — typically the SalaryEntry.payrollMonth
}

/**
 * Loads the single active PayrollConfiguration (and its rate/bracket/relief/
 * rebate rows) whose effective range covers the given date, and flattens it
 * into a PayrollConfigSnapshot. Implementation queries Prisma; Phase 1 stub only.
 */
export async function resolveConfig(
  _input: ResolveConfigInput,
): Promise<PayrollConfigSnapshot> {
  throw new Error("Not implemented — Phase 2");
}
