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

const SOCSO_CATEGORY_LABELS = {
  CATEGORY_1: "Category 1 (employment injury + invalidity)",
  CATEGORY_2: "Category 2 (employment injury only)",
} as const;

const CITIZENSHIP_LABELS = {
  CITIZEN: "Citizen",
  PERMANENT_RESIDENT: "Permanent resident",
  NON_CITIZEN: "Non-citizen",
} as const;

/**
 * EPFWageBand, EISRate and SOCSORate share the same wage/contribution row
 * shape — SOCSORate additionally has a `category` enum, EPFWageBand
 * additionally has citizenship+age discriminators (KWSP publishes a
 * separate fixed-amount table per Part, same as its percentage rates —
 * see epf-rates-section.tsx). One parameterized section covers all 3
 * rather than 3 near-identical components.
 */
export function WageBandArraySection({
  name,
  title,
  description,
  withCategory = false,
  withCitizenshipAge = false,
}: {
  name: "epfWageBands" | "eisRates" | "socsoRates";
  title: string;
  description: string;
  withCategory?: boolean;
  withCitizenshipAge?: boolean;
}) {
  const form = useFormContext<PayrollConfigFormValues>();
  const { fields, append, remove } = useFieldArray({ control: form.control, name });

  return (
    <Collapsible defaultOpen>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="grid gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="border-input grid gap-2 rounded-lg border p-3 sm:grid-cols-5">
                {withCategory ? (
                  <FormField
                    control={form.control}
                    name={`socsoRates.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-5">
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select
                            className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {Object.entries(SOCSO_CATEGORY_LABELS).map(([value, label]) => (
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
                ) : null}
                {withCitizenshipAge ? (
                  <>
                    <FormField
                      control={form.control}
                      name={`epfWageBands.${index}.citizenshipStatus`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-5">
                          <FormLabel>Citizenship</FormLabel>
                          <FormControl>
                            <select
                              className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
                              value={field.value}
                              onChange={field.onChange}
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
                      name={`epfWageBands.${index}.minAge`}
                      label="Min age (blank = none)"
                      step="1"
                    />
                    <NumberField<PayrollConfigFormValues>
                      name={`epfWageBands.${index}.maxAge`}
                      label="Max age (blank = none)"
                      step="1"
                    />
                  </>
                ) : null}
                <NumberField<PayrollConfigFormValues> name={`${name}.${index}.wageFrom`} label="Wage from (RM)" />
                <NumberField<PayrollConfigFormValues> name={`${name}.${index}.wageTo`} label="Wage to (RM, blank = no cap)" />
                <NumberField<PayrollConfigFormValues>
                  name={`${name}.${index}.employeeContribution`}
                  label="Employee (RM)"
                  step="0.01"
                />
                <NumberField<PayrollConfigFormValues>
                  name={`${name}.${index}.employerContribution`}
                  label="Employer (RM)"
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
                append(
                  (withCategory
                    ? {
                        category: "CATEGORY_1",
                        wageFrom: 0,
                        wageTo: null,
                        employeeContribution: 0,
                        employerContribution: 0,
                      }
                    : withCitizenshipAge
                      ? {
                          citizenshipStatus: "CITIZEN",
                          minAge: null,
                          maxAge: null,
                          wageFrom: 0,
                          wageTo: null,
                          employeeContribution: 0,
                          employerContribution: 0,
                        }
                      : {
                          wageFrom: 0,
                          wageTo: null,
                          employeeContribution: 0,
                          employerContribution: 0,
                        }) as never,
                )
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
