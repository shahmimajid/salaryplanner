"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { DetailRow } from "@/components/calculator/detail-row";
import { NumberField } from "@/components/calculator/number-field";
import { SavingsCategoryRow } from "@/components/calculator/savings-category-row";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";
import {
  savingsPlannerFormSchema,
  defaultSavingsPlannerValues,
  type SavingsPlannerFormValues,
} from "@/components/calculator/savings-schema";
import {
  summarizeSavingsPlan,
  type SavingsPlanSummaryViewModel,
} from "@/components/calculator/savings-planner-summary";
import { formatRinggit } from "@/lib/utils/currency";
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";

export function SavingsPlanner({
  result,
  onSummaryChange,
}: {
  result: SalaryCalculationViewModel;
  onSummaryChange: (summary: SavingsPlanSummaryViewModel | null) => void;
}) {
  const form = useForm<SavingsPlannerFormValues>({
    resolver: zodResolver(savingsPlannerFormSchema),
    defaultValues: defaultSavingsPlannerValues(),
  });

  const values = useWatch({ control: form.control });
  const hasWeekendSupport = result.weekendSupport.grossAmount !== "0.00";

  const summary = useMemo(() => {
    const allocations = values.allocations;
    if (!allocations) return null;
    return summarizeSavingsPlan({
      netSalary: result.netSalary,
      netWeekendSupportIncome: result.weekendSupport.netAdditionalIncome,
      saveAllNetWeekendSupport: hasWeekendSupport
        ? (values.saveAllNetWeekendSupport ?? false)
        : false,
      monthlySavingsTarget: values.monthlySavingsTarget,
      allocations: allocations as SavingsPlannerFormValues["allocations"],
    });
  }, [
    values,
    result.netSalary,
    result.weekendSupport.netAdditionalIncome,
    hasWeekendSupport,
  ]);

  useEffect(() => {
    onSummaryChange(summary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const computedAmountByCategory = new Map(
    (summary?.allocations ?? []).map((a) => [a.category, a.computedAmount]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savings planner</CardTitle>
        <CardDescription>
          Allocate this month&apos;s net salary. Recalculates live as you type —
          nothing here is saved yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <Form {...form}>
          <form className="grid gap-4">
            <NumberField<SavingsPlannerFormValues>
              name="monthlySavingsTarget"
              label="Monthly savings target (RM)"
              tooltip="Optional — compare against your savings amount below. Not saved between sessions yet."
            />

            {hasWeekendSupport ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="grid gap-0.5">
                  <Label htmlFor="save-all-weekend-support">
                    Save all net weekend-support income
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    Forces the entire net weekend-support amount (
                    {formatRinggit(result.weekendSupport.netAdditionalIncome)})
                    into weekend-support savings.
                  </span>
                </div>
                <Switch
                  id="save-all-weekend-support"
                  checked={values.saveAllNetWeekendSupport ?? false}
                  onCheckedChange={(checked) =>
                    form.setValue("saveAllNetWeekendSupport", checked)
                  }
                />
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              {SAVINGS_CATEGORIES.map((category) => (
                <SavingsCategoryRow
                  key={category}
                  category={category}
                  computedAmount={
                    computedAmountByCategory.get(category) ?? "0.00"
                  }
                  overridden={
                    category === "WEEKEND_SUPPORT_SAVINGS" &&
                    hasWeekendSupport &&
                    (values.saveAllNetWeekendSupport ?? false)
                  }
                />
              ))}
            </div>
          </form>
        </Form>

        {summary ? (
          <>
            <Separator />
            <div className="grid gap-2.5">
              <DetailRow
                label="Total net salary"
                value={formatRinggit(summary.totalNetSalary)}
              />
              <DetailRow
                label="Total committed expenses"
                value={formatRinggit(summary.totalCommittedExpenses)}
              />
              <DetailRow
                label={
                  summary.isOverAllocated
                    ? "Available balance · over-allocated"
                    : "Available balance"
                }
                value={formatRinggit(summary.availableBalance)}
              />
              <DetailRow
                label="Savings amount"
                value={formatRinggit(summary.savingsAmount)}
                emphasis
              />
              <DetailRow
                label="Savings percentage"
                value={`${summary.savingsPercentage}%`}
              />
              <DetailRow
                label="Amount contributed by weekend support"
                value={formatRinggit(summary.weekendSupportContribution)}
              />
              {summary.targetAchieved !== null ? (
                <DetailRow
                  label="Savings target"
                  value={
                    summary.targetAchieved ? "Achieved" : "Not yet achieved"
                  }
                />
              ) : null}
              <DetailRow
                label="Projected annual savings"
                value={formatRinggit(summary.projectedAnnualSavings)}
                tooltip="Projected as this month's savings × 12 — not an actual historical total, since calculations aren't saved yet."
              />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
