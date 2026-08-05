import { prisma } from "@/lib/db/prisma";
import { profileFormSchema, type ProfileFormValues } from "@/components/profile/profile-schema";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

/**
 * Single-row update on PayrollProfile.userId (a @unique key) — no
 * existence check or transaction needed, every user is guaranteed exactly
 * one row from signup. Past calculations are unaffected: they each pin
 * the profile snapshot in effect when they were saved
 * (SalaryCalculation.profileSnapshot), so this update only changes how
 * *future* calculations compute.
 */
export async function updatePayrollProfile(
  userId: string,
  input: ProfileFormValues,
): Promise<UpdateProfileResult> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  await prisma.payrollProfile.update({
    where: { userId },
    data: {
      citizenshipStatus: value.citizenshipStatus,
      isBelow60: value.isBelow60,
      residencyStatus: value.residencyStatus,
      maritalStatus: value.maritalStatus,
      spouseHasIncome: value.spouseHasIncome,
      numberOfChildren: value.numberOfChildren,
      childReliefClaims: value.childReliefClaims,
      epfEmployeeRatePercent: value.epfEmployeeRatePercent.toString(),
      lindung24JamOptIn: value.lindung24JamOptIn,
      zakatEnabled: value.zakatEnabled,
      claimsSocsoRelief: value.claimsSocsoRelief,
    },
  });

  return { ok: true };
}
