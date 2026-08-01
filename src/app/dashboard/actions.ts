"use server";

import { requireUser } from "@/lib/auth/require-user";
import { saveSalaryEntry } from "@/lib/history/save-salary-entry";
import { saveSavingsPlan } from "@/lib/savings/save-savings-plan";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { SalaryFormActionResult } from "@/components/calculator/salary-entry-form";
import type { SavingsPlanPersistInput } from "@/components/calculator/savings-schema";
import type { SaveSavingsPlanResult } from "@/lib/savings/save-savings-plan";

export async function saveSalaryEntryAction(
  input: SalaryEntryFormValues,
): Promise<SalaryFormActionResult> {
  const user = await requireUser();
  return saveSalaryEntry(user.id, input);
}

export async function saveSavingsPlanAction(
  input: SavingsPlanPersistInput,
): Promise<SaveSavingsPlanResult> {
  const user = await requireUser();
  return saveSavingsPlan(user.id, input);
}
