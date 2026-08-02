import { prisma } from "@/lib/db/prisma";
import { childReliefClaimsSchema } from "@/lib/payroll/config/profile-snapshot";
import type { ProfileFormValues } from "@/components/profile/profile-schema";

/**
 * Every user has exactly one PayrollProfile row from signup — findUniqueOrThrow
 * is safe here (no "not found" branch needed), same as the other 2 existing
 * profile-row reads in save-salary-entry.ts/load-calculation-detail.ts.
 */
export async function loadPayrollProfileFormValues(userId: string): Promise<ProfileFormValues> {
  const row = await prisma.payrollProfile.findUniqueOrThrow({ where: { userId } });

  return {
    citizenshipStatus: row.citizenshipStatus,
    isBelow60: row.isBelow60,
    residencyStatus: row.residencyStatus,
    maritalStatus: row.maritalStatus,
    spouseHasIncome: row.spouseHasIncome,
    numberOfChildren: row.numberOfChildren,
    childReliefClaims: childReliefClaimsSchema.parse(row.childReliefClaims),
    epfEmployeeRatePercent: Number(row.epfEmployeeRatePercent),
    lindung24JamOptIn: row.lindung24JamOptIn,
    zakatEnabled: row.zakatEnabled,
  };
}
