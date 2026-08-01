import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { GrossVsNetChart } from "@/components/dashboard/gross-vs-net-chart";
import { DeductionBreakdownChart } from "@/components/dashboard/deduction-breakdown-chart";
import { WeekendSupportChart } from "@/components/dashboard/weekend-support-chart";
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";
import type { SavingsPlanSummaryViewModel } from "@/components/calculator/savings-planner-summary";

export function Dashboard({
  result,
  savingsSummary,
}: {
  result: SalaryCalculationViewModel;
  savingsSummary: SavingsPlanSummaryViewModel | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>
          Based on this month&apos;s calculation only — trend, history, and
          annual-total charts need saved calculations across multiple months,
          which this local-mode version doesn&apos;t have yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <DashboardCards result={result} savingsSummary={savingsSummary} />
        <div className="grid gap-6 sm:grid-cols-2">
          <GrossVsNetChart
            grossSalary={result.grossSalary}
            netSalary={result.netSalary}
          />
          <DeductionBreakdownChart data={result} />
        </div>
        <WeekendSupportChart data={result} />
      </CardContent>
    </Card>
  );
}
