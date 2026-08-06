"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/calculator/number-field";
import { WeekendSupportFields } from "@/components/calculator/weekend-support-fields";
import { ResultsPanel } from "@/components/calculator/results-panel";
import { SavingsPlanner } from "@/components/calculator/savings-planner";
import { Dashboard } from "@/components/dashboard/dashboard";
import {
  salaryEntryFormSchema,
  type SalaryEntryFormValues,
} from "@/components/calculator/schema";
import { calculateSalaryAction } from "@/app/actions";
import type { SalaryCalculationViewModel } from "@/components/calculator/to-view-model";
import type { SavingsPlanSummaryViewModel } from "@/components/calculator/savings-planner-summary";
import type { SavingsPlannerFormValues } from "@/components/calculator/savings-schema";
import type { SavingsPlannerProps } from "@/components/calculator/savings-planner";
import { saveDraft, type DraftSalaryEntry } from "@/lib/offline/db";

// Superset of both calculateSalaryAction's (local-mode) and
// saveSalaryEntry's (authenticated) return shapes — salaryEntryId is only
// present for the persisting action, used to link to the saved history
// entry. A function returning either narrower shape is structurally
// assignable here (missing optional fields are fine).
export type SalaryFormActionResult =
  | { ok: true; data: SalaryCalculationViewModel; salaryEntryId?: string }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

function buildDraft(userId: string, values: SalaryEntryFormValues): DraftSalaryEntry {
  return {
    localId: crypto.randomUUID(),
    userId,
    values,
    createdAt: Date.now(),
    status: "pending",
  };
}

function defaultPayrollMonth(): string {
  // Defaults to January of the current year, not "today" — the cumulative
  // PCB reconciliation assumes "previous cumulative income/PCB" fields (in
  // the collapsed advanced section, default 0) correctly reflect every
  // month before the selected one. January is the only month where a
  // zero default for those fields is actually self-consistent; any later
  // month with them left at 0 silently under-projects annual income.
  return `${new Date().getFullYear()}-01`;
}

export interface SalaryEntryFormProps {
  /** Defaults to the local-mode calculateSalaryAction (no persistence). */
  action?: (values: SalaryEntryFormValues) => Promise<SalaryFormActionResult>;
  /** Overrides the default "default profile" note under the form title. */
  profileNote?: React.ReactNode;
  /** Rendered above the results panel when the action returns a salaryEntryId (i.e. it persisted). */
  renderSavedNotice?: (salaryEntryId: string) => React.ReactNode;
  /** Pre-fills the form (edit) or seeds a new entry from a prior one (duplicate). */
  initialValues?: Partial<SalaryEntryFormValues>;
  /** True only for edit — locks the month so a resubmit collapses onto the same entry, never a different one. */
  payrollMonthLocked?: boolean;
  /** Passed straight through to SavingsPlanner; omitted in local mode. */
  savingsPlanAction?: SavingsPlannerProps["action"];
  /** Passed straight through to SavingsPlanner, for edit/duplicate. */
  savingsPlanInitialValues?: SavingsPlannerFormValues;
  /** True only on /dashboard — offline drafts are only meaningful for the persisting flow. */
  offlineCapable?: boolean;
  /** Required when offlineCapable is true, to scope the saved draft to this user. */
  userId?: string;
}

export function SalaryEntryForm({
  action = calculateSalaryAction,
  profileNote,
  renderSavedNotice,
  initialValues,
  payrollMonthLocked = false,
  savingsPlanAction,
  savingsPlanInitialValues,
  offlineCapable = false,
  userId,
}: SalaryEntryFormProps = {}) {
  const [result, setResult] = useState<SalaryCalculationViewModel | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [savingsSummary, setSavingsSummary] =
    useState<SavingsPlanSummaryViewModel | null>(null);

  const form = useForm<SalaryEntryFormValues>({
    resolver: zodResolver(salaryEntryFormSchema),
    defaultValues: {
      payrollMonth: defaultPayrollMonth(),
      fixedAllowance: 0,
      weekendSupportPaymentMethod: "MANUAL_TOTAL",
      weekendSupportManualTotalAmount: 0,
      bonus: 0,
      commission: 0,
      overtime: 0,
      otherTaxableIncome: 0,
      otherNonTaxableReimbursement: 0,
      epfAdjustment: 0,
      zakat: 0,
      previousCumulativeIncomeForYear: 0,
      previousCumulativePcbPaid: 0,
      ...initialValues,
    },
  });

  async function onSubmit(values: SalaryEntryFormValues) {
    setServerError(null);
    setSavedOffline(false);

    if (offlineCapable && userId && typeof navigator !== "undefined" && !navigator.onLine) {
      // No computed result to show offline — the calculation engine only
      // runs server-side. The draft just captures the input; ResultsPanel/
      // SavingsPlanner/Dashboard only appear once it's synced.
      await saveDraft(buildDraft(userId, values));
      setSavedOffline(true);
      return;
    }

    const response = await action(values);
    if (!response.ok) {
      setServerError("Please check the highlighted fields and try again.");
      for (const [field, messages] of Object.entries(response.fieldErrors)) {
        if (messages?.length) {
          form.setError(field as keyof SalaryEntryFormValues, {
            message: messages[0],
          });
        }
      }
      return;
    }
    setSavedEntryId(response.salaryEntryId ?? null);
    setResult(response.data);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Salary entry</CardTitle>
                <CardDescription>
                  {profileNote ?? (
                    <>
                      Calculated using the default profile — married, 4 children
                      (100% relief), EPF 11%, tax resident.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="payrollMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payroll month</FormLabel>
                      <FormControl>
                        <Input type="month" disabled={payrollMonthLocked} {...field} />
                      </FormControl>
                      {payrollMonthLocked ? (
                        <p className="text-muted-foreground text-xs">
                          Locked while editing — the saved entry for this month is
                          updated in place.
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <NumberField
                  name="basicSalary"
                  label="Basic salary (RM)"
                  tooltip="Your fixed monthly base pay before allowances, bonus, or weekend support."
                />

                <WeekendSupportFields />

                {serverError ? (
                  <p className="text-destructive text-sm">{serverError}</p>
                ) : null}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  {form.formState.isSubmitting ? "Calculating…" : "Calculate"}
                </Button>
              </CardContent>
            </Card>

            <Collapsible>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer select-none">
                    <CardTitle className="text-base">
                      Additional income &amp; deductions
                    </CardTitle>
                    <CardDescription>
                      Optional — expand to refine your estimate.
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <NumberField
                      name="fixedAllowance"
                      label="Fixed allowance (RM)"
                    />
                    <NumberField
                      name="bonus"
                      label="Bonus (RM)"
                      tooltip="Additional remuneration such as a bonus — taxed via a separate lump-sum PCB estimate."
                    />
                    <NumberField name="commission" label="Commission (RM)" />
                    <NumberField
                      name="overtime"
                      label="Overtime (RM)"
                      tooltip="Taxable, but excluded from the EPF wage base (EPF Act Third Schedule)."
                    />
                    <NumberField
                      name="otherTaxableIncome"
                      label="Other taxable income (RM)"
                    />
                    <NumberField
                      name="otherNonTaxableReimbursement"
                      label="Other non-taxable reimbursement (RM)"
                    />
                    <NumberField
                      name="epfAdjustment"
                      label="Employee EPF adjustment (RM)"
                      allowNegative
                    />
                    <NumberField name="zakat" label="Zakat (RM)" />
                    <NumberField
                      name="previousCumulativeIncomeForYear"
                      label="Previous cumulative income this year (RM)"
                    />
                    <NumberField
                      name="previousCumulativePcbPaid"
                      label="Previous cumulative PCB paid (RM)"
                    />
                    <div className="sm:col-span-2">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </form>
        </Form>

        <div className="md:sticky md:top-6 md:grid md:gap-4">
          {result ? (
            <>
              {savedEntryId && renderSavedNotice ? renderSavedNotice(savedEntryId) : null}
              <ResultsPanel data={result} />
            </>
          ) : savedOffline ? (
            <Card>
              <CardContent className="py-10 text-center text-sm">
                Saved offline — will sync automatically when you&apos;re back online.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                Enter your basic salary and click Calculate to see your net
                salary breakdown.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {result ? (
        <>
          <SavingsPlanner
            result={result}
            onSummaryChange={setSavingsSummary}
            salaryEntryId={savedEntryId ?? undefined}
            action={savingsPlanAction}
            initialValues={savingsPlanInitialValues}
          />
          <Dashboard result={result} savingsSummary={savingsSummary} />
        </>
      ) : null}
    </div>
  );
}
