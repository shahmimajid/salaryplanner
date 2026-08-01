import { StatCard } from "@/components/ui/stat-card";
import { formatRinggit } from "@/lib/utils/currency";
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";
import type { SavingsPlanSummaryViewModel } from "@/components/calculator/savings-planner-summary";

export function DashboardCards({
  result,
  savingsSummary,
}: {
  result: SalaryCalculationViewModel;
  savingsSummary: SavingsPlanSummaryViewModel | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      <StatCard
        label="Current gross salary"
        value={formatRinggit(result.grossSalary)}
      />
      <StatCard
        label="Current net salary"
        value={formatRinggit(result.netSalary)}
      />
      <StatCard
        label="Total deductions"
        value={formatRinggit(result.totalDeductions)}
      />
      <StatCard
        label="Net weekend-support income"
        value={
          result.weekendSupport.grossAmount !== "0.00"
            ? formatRinggit(result.weekendSupport.netAdditionalIncome)
            : null
        }
        placeholder="No weekend support entered"
      />
      <StatCard
        label="Monthly savings"
        value={
          savingsSummary ? formatRinggit(savingsSummary.savingsAmount) : null
        }
        placeholder="Plan your savings below to see this"
      />
      <StatCard
        label="Annual projected savings"
        value={
          savingsSummary
            ? formatRinggit(savingsSummary.projectedAnnualSavings)
            : null
        }
        placeholder="Plan your savings below to see this"
      />
    </div>
  );
}
