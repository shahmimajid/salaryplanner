import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SavingsTrendChart } from "@/components/dashboard/savings-trend-chart";
import { SalaryHistoryChart } from "@/components/dashboard/salary-history-chart";
import type { MonthlySeriesPoint } from "@/lib/history/list-monthly-series";

/**
 * Always visible for signed-in users regardless of whether they've
 * calculated this session — unlike Dashboard (which only renders after a
 * same-session Calculate click), this reads directly from persisted
 * history, so it can show trends across every saved month immediately.
 */
export function HistoryTrends({ series }: { series: MonthlySeriesPoint[] }) {
  if (series.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>History trends</CardTitle>
        <CardDescription>
          Across all {series.length} saved month{series.length === 1 ? "" : "s"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <SavingsTrendChart data={series} />
        <SalaryHistoryChart data={series} />
      </CardContent>
    </Card>
  );
}
