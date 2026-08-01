"use client";

import Link from "next/link";
import { SalaryEntryForm } from "@/components/calculator/salary-entry-form";
import { saveSalaryEntryAction, saveSavingsPlanAction } from "@/app/dashboard/actions";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { SavingsPlannerFormValues } from "@/components/calculator/savings-schema";

export function EditEntryForm({
  salaryEntryId,
  initialValues,
  savingsPlanInitialValues,
}: {
  salaryEntryId: string;
  initialValues: SalaryEntryFormValues;
  savingsPlanInitialValues: SavingsPlannerFormValues | null;
}) {
  return (
    <SalaryEntryForm
      action={saveSalaryEntryAction}
      savingsPlanAction={saveSavingsPlanAction}
      initialValues={initialValues}
      savingsPlanInitialValues={savingsPlanInitialValues ?? undefined}
      payrollMonthLocked
      profileNote={<>Editing the saved calculation for {initialValues.payrollMonth}.</>}
      renderSavedNotice={() => (
        <div className="bg-muted/30 rounded-lg border p-3 text-sm">
          Saved.{" "}
          <Link href={`/history/${salaryEntryId}`} className="font-medium underline">
            Back to this calculation
          </Link>
        </div>
      )}
    />
  );
}
