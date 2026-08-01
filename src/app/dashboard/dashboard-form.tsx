"use client";

import Link from "next/link";
import { SalaryEntryForm } from "@/components/calculator/salary-entry-form";
import { saveSalaryEntryAction } from "@/app/dashboard/actions";

export function DashboardForm() {
  return (
    <SalaryEntryForm
      action={saveSalaryEntryAction}
      profileNote={
        <>
          Calculated and saved using your profile — married, 4 children (100% relief),
          EPF 11%, tax resident. Profile editing arrives in a later phase.
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
