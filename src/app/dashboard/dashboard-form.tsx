"use client";

import Link from "next/link";
import { SalaryEntryForm } from "@/components/calculator/salary-entry-form";
import { saveSalaryEntryAction, saveSavingsPlanAction } from "@/app/dashboard/actions";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";
import type { SavingsPlannerFormValues } from "@/components/calculator/savings-schema";

export function DashboardForm({
  initialValues,
  savingsPlanInitialValues,
  userId,
}: {
  initialValues?: Partial<SalaryEntryFormValues>;
  savingsPlanInitialValues?: SavingsPlannerFormValues;
  userId: string;
}) {
  return (
    <SalaryEntryForm
      action={saveSalaryEntryAction}
      savingsPlanAction={saveSavingsPlanAction}
      initialValues={initialValues}
      savingsPlanInitialValues={savingsPlanInitialValues}
      offlineCapable
      userId={userId}
      profileNote={
        <>
          Calculated and saved using your profile.{" "}
          <Link href="/profile" className="underline">
            Edit your profile
          </Link>
          .
        </>
      }
      renderSavedNotice={(salaryEntryId) => (
        <div className="bg-muted/30 rounded-lg border p-3 text-sm">
          Saved for this month.{" "}
          <Link href={`/history/${salaryEntryId}`} className="font-medium underline">
            View in history
          </Link>
        </div>
      )}
    />
  );
}
