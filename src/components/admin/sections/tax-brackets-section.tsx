"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberField } from "@/components/calculator/number-field";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

const RESIDENCY_LABELS = {
  RESIDENT: "Tax resident",
  NON_RESIDENT: "Non-resident",
} as const;

export function TaxBracketsSection() {
  const form = useFormContext<PayrollConfigFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "taxBrackets" });

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="text-base">Tax brackets</CardTitle>
            <CardDescription>
              Progressive chargeable-income bands, by residency status.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border-input grid gap-2 rounded-lg border p-3 sm:grid-cols-5">
                <FormField
                  control={form.control}
                  name={`taxBrackets.${index}.residencyStatus`}
                  render={({ field: selectField }) => (
                    <FormItem className="sm:col-span-5">
                      <FormLabel>Residency</FormLabel>
                      <FormControl>
                        <select
                          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                          value={selectField.value}
                          onChange={selectField.onChange}
                        >
                          {Object.entries(RESIDENCY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxBrackets.${index}.chargeableIncomeFrom`}
                  label="Income from (RM)"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxBrackets.${index}.chargeableIncomeTo`}
                  label="Income to (RM, blank = no cap)"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxBrackets.${index}.ratePercent`}
                  label="Rate (%)"
                  step="0.01"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxBrackets.${index}.cumulativeTaxBase`}
                  label="Cumulative tax at band start (RM)"
                  step="0.01"
                />
                <div className="flex items-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() =>
                append({
                  residencyStatus: "RESIDENT",
                  chargeableIncomeFrom: 0,
                  chargeableIncomeTo: null,
                  ratePercent: 0,
                  cumulativeTaxBase: 0,
                })
              }
            >
              Add row
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
