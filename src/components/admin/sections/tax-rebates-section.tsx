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
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/calculator/number-field";
import { Textarea } from "@/components/ui/textarea";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

export function TaxRebatesSection() {
  const form = useFormContext<PayrollConfigFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "taxRebates" });

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="text-base">Tax rebates</CardTitle>
            <CardDescription>
              Rebates applied after tax, subject to an income threshold.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border-input grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`taxRebates.${index}.code`}
                  render={({ field: codeField }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...codeField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`taxRebates.${index}.label`}
                  render={({ field: labelField }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...labelField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxRebates.${index}.amount`}
                  label="Amount (RM, blank = none)"
                  step="0.01"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`taxRebates.${index}.incomeThreshold`}
                  label="Income threshold (RM, blank = none)"
                  step="0.01"
                />
                <FormField
                  control={form.control}
                  name={`taxRebates.${index}.description`}
                  render={({ field: descField }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          value={descField.value ?? ""}
                          onChange={(event) => descField.onChange(event.target.value || null)}
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
                append({ code: "", label: "", amount: null, incomeThreshold: null, description: null })
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
