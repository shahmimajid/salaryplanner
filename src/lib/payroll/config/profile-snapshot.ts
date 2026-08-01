import Decimal from "decimal.js";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import type { PayrollProfileSnapshot } from "../types";
import { DEFAULT_PAYROLL_PROFILE } from "./default-profile";

/**
 * Nested-create data for a new User's PayrollProfile, seeded from the
 * spec's default profile (DEFAULT_PAYROLL_PROFILE) — every signed-up user
 * behaves identically to local mode's default from their first
 * calculation. No profile-editing UI exists yet (docs/assumptions.md #19),
 * so this is currently the only way a PayrollProfile row is ever created.
 */
export function defaultPayrollProfileCreateData(): Prisma.PayrollProfileCreateWithoutUserInput {
  return {
    citizenshipStatus: DEFAULT_PAYROLL_PROFILE.citizenshipStatus,
    isBelow60: DEFAULT_PAYROLL_PROFILE.isBelow60,
    residencyStatus: DEFAULT_PAYROLL_PROFILE.residencyStatus,
    maritalStatus: DEFAULT_PAYROLL_PROFILE.maritalStatus,
    spouseHasIncome: DEFAULT_PAYROLL_PROFILE.spouseHasIncome,
    numberOfChildren: DEFAULT_PAYROLL_PROFILE.numberOfChildren,
    childReliefClaims: DEFAULT_PAYROLL_PROFILE.childReliefClaims,
    epfEmployeeRatePercent: DEFAULT_PAYROLL_PROFILE.epfEmployeeRatePercent.toString(),
    lindung24JamOptIn: DEFAULT_PAYROLL_PROFILE.lindung24JamOptIn,
    zakatEnabled: DEFAULT_PAYROLL_PROFILE.zakatEnabled,
  };
}

const childReliefClaimSchema = z.object({
  belowAge18: z.boolean(),
  reliefPercentageClaimed: z.number(),
});

const childReliefClaimsSchema = z.array(childReliefClaimSchema);

/**
 * Converts a persisted PayrollProfile row into the engine's
 * PayrollProfileSnapshot. childReliefClaims is an untyped Json column —
 * validated here (input validation applies to DB-sourced data too, not
 * just form input) before it reaches the trusted calculation engine.
 */
export function toPayrollProfileSnapshot(row: {
  citizenshipStatus: PayrollProfileSnapshot["citizenshipStatus"];
  isBelow60: boolean;
  residencyStatus: PayrollProfileSnapshot["residencyStatus"];
  maritalStatus: PayrollProfileSnapshot["maritalStatus"];
  spouseHasIncome: boolean;
  numberOfChildren: number;
  childReliefClaims: Prisma.JsonValue;
  epfEmployeeRatePercent: Prisma.Decimal;
  lindung24JamOptIn: boolean;
  zakatEnabled: boolean;
}): PayrollProfileSnapshot {
  return {
    citizenshipStatus: row.citizenshipStatus,
    isBelow60: row.isBelow60,
    residencyStatus: row.residencyStatus,
    maritalStatus: row.maritalStatus,
    spouseHasIncome: row.spouseHasIncome,
    numberOfChildren: row.numberOfChildren,
    childReliefClaims: childReliefClaimsSchema.parse(row.childReliefClaims),
    epfEmployeeRatePercent: new Decimal(row.epfEmployeeRatePercent.toString()),
    lindung24JamOptIn: row.lindung24JamOptIn,
    zakatEnabled: row.zakatEnabled,
  };
}
