import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { DashboardForm } from "@/app/dashboard/dashboard-form";
import { loadSalaryEntryFormValues } from "@/lib/history/load-salary-entry-form-values";
import { loadSavingsPlanFormValues } from "@/lib/savings/load-savings-plan";
import { listMonthlySeries } from "@/lib/history/list-monthly-series";
import { HistoryTrends } from "@/components/dashboard/history-trends";
import { OfflineSyncManager } from "@/components/pwa/offline-sync-manager";
import { OfflineDraftsBanner } from "@/components/pwa/offline-drafts-banner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicateFrom?: string; month?: string }>;
}) {
  const user = await requireUser();
  const { duplicateFrom, month } = await searchParams;
  const series = await listMonthlySeries(user.id);

  let initialValues = undefined;
  let savingsPlanInitialValues = undefined;
  if (duplicateFrom) {
    const source = await loadSalaryEntryFormValues(user.id, duplicateFrom);
    if (source) {
      initialValues = { ...source, payrollMonth: month || source.payrollMonth };
      savingsPlanInitialValues =
        (await loadSavingsPlanFormValues(user.id, duplicateFrom)) ?? undefined;
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Calculations here are saved to your account.
          </p>
        </div>
        <Link href="/history" className="text-sm underline">
          View history
        </Link>
      </div>
      <OfflineSyncManager userId={user.id} />
      <OfflineDraftsBanner userId={user.id} />
      <DashboardForm
        initialValues={initialValues}
        savingsPlanInitialValues={savingsPlanInitialValues}
        userId={user.id}
      />
      <div className="mt-6">
        <HistoryTrends series={series} />
      </div>
    </main>
  );
}
