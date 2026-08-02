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
import { Textarea } from "@/components/ui/textarea";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

const CITIZENSHIP_LABELS = {
  CITIZEN: "Citizen",
  PERMANENT_RESIDENT: "Permanent resident",
  NON_CITIZEN: "Non-citizen",
} as const;

export function EpfRatesSection() {
  const form = useFormContext<PayrollConfigFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "epfRates" });

  return (
    <Collapsible defaultOpen>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="text-base">EPF rates</CardTitle>
            <CardDescription>
              Employee/employer contribution rates by citizenship and age band.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border-input grid gap-2 rounded-lg border p-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`epfRates.${index}.citizenshipStatus`}
                  render={({ field: selectField }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Citizenship</FormLabel>
                      <FormControl>
                        <select
                          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                          value={selectField.value}
                          onChange={selectField.onChange}
                        >
                          {Object.entries(CITIZENSHIP_LABELS).map(([value, label]) => (
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
                  name={`epfRates.${index}.minAge`}
                  label="Min age (blank = none)"
                  step="1"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`epfRates.${index}.maxAge`}
                  label="Max age (blank = none)"
                  step="1"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`epfRates.${index}.employeeRatePercent`}
                  label="Employee rate (%)"
                  step="0.001"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`epfRates.${index}.employerRatePercent`}
                  label="Employer rate (%)"
                  step="0.001"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`epfRates.${index}.employerRateThreshold`}
                  label="Employer rate wage threshold (RM, blank = flat rate)"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`epfRates.${index}.employerRateAbovePercent`}
                  label="Employer rate above threshold (%, blank = flat rate)"
                  step="0.001"
                />
                <FormField
                  control={form.control}
                  name={`epfRates.${index}.notes`}
                  render={({ field: notesField }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          value={notesField.value ?? ""}
                          onChange={(event) => notesField.onChange(event.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
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
                  citizenshipStatus: "CITIZEN",
                  minAge: null,
                  maxAge: null,
                  employeeRatePercent: 0,
                  employerRatePercent: 0,
                  employerRateThreshold: null,
                  employerRateAbovePercent: null,
                  notes: null,
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
