"use client";

import { useFormContext, type FieldPath } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldTooltip } from "@/components/calculator/field-tooltip";
import type { SalaryEntryFormValues } from "@/components/calculator/schema";

interface NumberFieldProps {
  name: FieldPath<SalaryEntryFormValues>;
  label: string;
  tooltip?: React.ReactNode;
  step?: string;
  allowNegative?: boolean;
}

/**
 * Native <input type="number"> always emits/expects string values, but the
 * form's typed state (SalaryEntryFormValues, from z.infer) holds numbers —
 * spreading react-hook-form's {...field} directly onto the input would
 * silently store raw strings instead. This wrapper does the string<->number
 * conversion explicitly at the one boundary where it needs to happen.
 */
export function NumberField({
  name,
  label,
  tooltip,
  step = "0.01",
  allowNegative = false,
}: NumberFieldProps) {
  const form = useFormContext<SalaryEntryFormValues>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            {label}
            {tooltip ? <FieldTooltip>{tooltip}</FieldTooltip> : null}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={allowNegative ? undefined : 0}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={typeof field.value === "number" ? field.value : ""}
              onChange={(event) => {
                const raw = event.target.value;
                field.onChange(raw === "" ? undefined : Number(raw));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
