"use server";

import { requireUser } from "@/lib/auth/require-user";
import { updatePayrollProfile, type UpdateProfileResult } from "@/lib/profile/update-profile";
import type { ProfileFormValues } from "@/components/profile/profile-schema";

export async function updateProfileAction(
  input: ProfileFormValues,
): Promise<UpdateProfileResult> {
  const user = await requireUser();
  return updatePayrollProfile(user.id, input);
}
