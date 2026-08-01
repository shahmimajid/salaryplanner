"use server";

import { requireUser } from "@/lib/auth/require-user";
import { saveSalaryEntry } from "@/lib/history/save-salary-entry";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { SalaryFormActionResult } from "@/components/calculator/salary-entry-form";

export async function saveSalaryEntryAction(
  input: SalaryEntryFormValues,
): Promise<SalaryFormActionResult> {
  const user = await requireUser();
  return saveSalaryEntry(user.id, input);
}
