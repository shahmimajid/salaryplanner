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
          Based on this calculation only. Signed-in users see trend and annual
          charts across every saved month on the Dashboard and History pages.
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
