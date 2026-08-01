"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NumberField } from "@/components/calculator/number-field";
import { FieldTooltip } from "@/components/calculator/field-tooltip";
import { SAVINGS_CATEGORY_META } from "@/components/calculator/savings-category-meta";
import { formatRinggit } from "@/lib/utils/currency";
import type { SavingsCategory } from "@/lib/payroll/types";
import type { SavingsPlannerFormValues } from "@/components/calculator/savings-schema";

export function SavingsCategoryRow({
  category,
  computedAmount,
  overridden,
}: {
  category: SavingsCategory;
  /** Live-computed RM amount for this row, already formatted. */
  computedAmount: string;
  /** True for WEEKEND_SUPPORT_SAVINGS while "save all" is enabled — its own
   * allocation is ignored/overridden, so its inputs are disabled rather than
   * left editable-but-silently-unused. */
  overridden?: boolean;
}) {
  const form = useFormContext<SavingsPlannerFormValues>();
  const meta = SAVINGS_CATEGORY_META[category];
  const allocationType = form.watch(`allocations.${category}.allocationType`);

  return (
    <div className="border-input grid gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {meta.label}
          <FieldTooltip>{meta.tooltip}</FieldTooltip>
        </span>
        <span className="text-sm font-semibold">
          {formatRinggit(computedAmount)}
        </span>
      </div>

      {overridden ? (
        <p className="text-muted-foreground text-xs">
          Overridden — the full net weekend-support amount goes here because
          &quot;Save all net weekend-support income&quot; is on.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <FormField
            control={form.control}
            name={`allocations.${category}.allocationType`}
            render={({ field }) => (
              <FormItem className="contents">
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-1.5"
                  >
                    <label className="border-input has-[[data-checked]]:border-primary flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                      <RadioGroupItem value="FIXED_AMOUNT" />
                      RM amount
                    </label>
                    <label className="border-input has-[[data-checked]]:border-primary flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                      <RadioGroupItem value="PERCENTAGE" />% of net salary
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-28">
            {allocationType === "PERCENTAGE" ? (
              <NumberField<SavingsPlannerFormValues>
                name={`allocations.${category}.percentage`}
                step="1"
              />
            ) : (
              <NumberField<SavingsPlannerFormValues>
                name={`allocations.${category}.amount`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
