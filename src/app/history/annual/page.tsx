import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listSalaryEntries, listAvailableYears } from "@/lib/history/list-salary-entries";
import { computeAnnualSummary } from "@/lib/history/annual-summary";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { AnnualSummaryChart } from "@/components/dashboard/annual-summary-chart";
import { formatRinggit } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

export default async function AnnualSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const { year } = await searchParams;

  const allEntries = await listSalaryEntries(user.id);
  const availableYears = listAvailableYears(allEntries);
  const selectedYear = year ? Number(year) : (availableYears[0] ?? new Date().getFullYear());

  const summary = await computeAnnualSummary(user.id, selectedYear);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6 space-y-1">
        <Link href="/history" className="text-muted-foreground text-sm underline">
          ← Back to history
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Annual totals</h1>
      </div>

      {summary.monthCount > 0 ? (
        <div className="mb-6">
          <a
            href={`/api/export/history?year=${selectedYear}`}
            className="text-sm underline"
          >
            Download CSV for {selectedYear}
          </a>
        </div>
      ) : null}

      {availableYears.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          {availableYears.map((y) => (
            <Link
              key={y}
              href={`/history/annual?year=${y}`}
              className={cn(
                "rounded-md border px-2.5 py-1",
                selectedYear === y && "border-primary bg-primary/5 font-medium",
              )}
            >
              {y}
            </Link>
          ))}
        </div>
      ) : null}

      {summary.monthCount === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No saved calculations for {selectedYear}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Total basic salary" value={formatRinggit(summary.totalBasicSalary)} />
            <StatCard
              label="Total weekend-support allowance"
              value={formatRinggit(summary.totalWeekendSupportAllowance)}
            />
            <StatCard label="Total EPF" value={formatRinggit(summary.totalEpf)} />
            <StatCard label="Total SOCSO" value={formatRinggit(summary.totalSocso)} />
            <StatCard label="Total EIS" value={formatRinggit(summary.totalEis)} />
            <StatCard label="Total PCB" value={formatRinggit(summary.totalPcb)} />
            <StatCard label="Total net salary" value={formatRinggit(summary.totalNetSalary)} />
            <StatCard label="Total savings" value={formatRinggit(summary.totalSavings)} />
            <StatCard
              label="Average effective deduction rate"
              value={`${summary.averageEffectiveDeductionRatePercent}%`}
            />
          </div>
          <AnnualSummaryChart summary={summary} />
        </div>
      )}
    </main>
  );
}
