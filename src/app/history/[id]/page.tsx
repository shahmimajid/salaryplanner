import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { loadCalculationDetail } from "@/lib/history/load-calculation-detail";
import { loadSavingsPlanSummary } from "@/lib/savings/load-savings-plan-summary";
import { ResultsPanel } from "@/components/calculator/results-panel";
import { Dashboard } from "@/components/dashboard/dashboard";
import { DeleteEntryButton } from "@/components/history/delete-entry-button";
import { DuplicateEntryButton } from "@/components/history/duplicate-entry-button";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await loadCalculationDetail(user.id, id);

  if (!detail) {
    notFound();
  }

  const savingsSummary = await loadSavingsPlanSummary(user.id, detail.salaryEntryId);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <Link href="/history" className="text-muted-foreground text-sm underline">
            ← Back to history
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{detail.payrollMonth}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/history/${detail.salaryEntryId}/edit`}
            className="text-sm underline"
          >
            Edit
          </Link>
          <a
            href={`/api/export/payslip/${detail.salaryEntryId}`}
            className="text-sm underline"
          >
            Download payslip (PDF)
          </a>
          <DuplicateEntryButton salaryEntryId={detail.salaryEntryId} />
          <DeleteEntryButton salaryEntryId={detail.salaryEntryId} />
        </div>
      </div>

      <div className="grid gap-6">
        <ResultsPanel data={detail.data} />
        <Dashboard result={detail.data} savingsSummary={savingsSummary} />
      </div>
    </main>
  );
}
