import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import {
  listSalaryEntries,
  filterEntriesByYear,
  listAvailableYears,
} from "@/lib/history/list-salary-entries";
import { Card, CardContent } from "@/components/ui/card";
import { HistoryList } from "@/components/history/history-list";
import { cn } from "@/lib/utils";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const { year } = await searchParams;
  const allEntries = await listSalaryEntries(user.id);
  const availableYears = listAvailableYears(allEntries);
  const selectedYear = year ? Number(year) : undefined;
  const entries = selectedYear ? filterEntriesByYear(allEntries, selectedYear) : allEntries;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground text-sm">Your saved calculations.</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={`/api/export/history${selectedYear ? `?year=${selectedYear}` : ""}`}
            className="text-sm underline"
          >
            Download CSV
          </a>
          <Link href="/history/annual" className="text-sm underline">
            Annual totals
          </Link>
          <Link href="/dashboard" className="text-sm underline">
            New calculation
          </Link>
        </div>
      </div>

      {allEntries.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            No saved calculations yet.{" "}
            <Link href="/dashboard" className="underline">
              Calculate your first one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          {availableYears.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/history"
                className={cn(
                  "rounded-md border px-2.5 py-1",
                  !selectedYear && "border-primary bg-primary/5 font-medium",
                )}
              >
                All
              </Link>
              {availableYears.map((y) => (
                <Link
                  key={y}
                  href={`/history?year=${y}`}
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

          {entries.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                No calculations saved for {selectedYear}.
              </CardContent>
            </Card>
          ) : (
            <HistoryList entries={entries} />
          )}
        </>
      )}
    </main>
  );
}
