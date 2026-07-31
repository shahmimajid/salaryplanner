"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldTooltip } from "@/components/calculator/field-tooltip";
import { NumberField } from "@/components/calculator/number-field";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";

const PAYMENT_METHOD_LABELS: Record<
  SalaryEntryFormValues["weekendSupportPaymentMethod"],
  string
> = {
  FIXED_PER_DAY: "Fixed amount per support day",
  FIXED_MONTHLY: "Fixed monthly allowance",
  MANUAL_TOTAL: "Manually entered total",
};

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as Array<
  keyof typeof PAYMENT_METHOD_LABELS
>;

export function WeekendSupportFields() {
  const form = useFormContext<SalaryEntryFormValues>();
  const paymentMethod = form.watch("weekendSupportPaymentMethod");

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium">Weekend-support allowance</span>
        <FieldTooltip>
          Extra income for weekend work, treated as an allowance/additional wage
          — not statutory overtime by default.
        </FieldTooltip>
      </div>

      <FormField
        control={form.control}
        name="weekendSupportPaymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method}
                    className="border-input has-[[data-checked]]:border-primary flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <RadioGroupItem value={method} />
                    {PAYMENT_METHOD_LABELS[method]}
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {paymentMethod === "FIXED_PER_DAY" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            name="weekendSupportFixedRatePerDay"
            label="Rate per day (RM)"
          />
          <NumberField
            name="weekendSupportDaysCount"
            label="Number of days"
            step="1"
          />
        </div>
      )}

      {paymentMethod === "FIXED_MONTHLY" && (
        <NumberField
          name="weekendSupportFixedMonthlyAmount"
          label="Fixed monthly allowance (RM)"
        />
      )}

      {paymentMethod === "MANUAL_TOTAL" && (
        <NumberField
          name="weekendSupportManualTotalAmount"
          label="Total support allowance (RM)"
        />
      )}
    </div>
  );
}
