"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { EpfRatesSection } from "@/components/admin/sections/epf-rates-section";
import { TaxBracketsSection } from "@/components/admin/sections/tax-brackets-section";
import { TaxReliefsSection } from "@/components/admin/sections/tax-reliefs-section";
import { TaxRebatesSection } from "@/components/admin/sections/tax-rebates-section";
import { WageBandArraySection } from "@/components/admin/sections/wage-band-array-section";
import {
  payrollConfigFormSchema,
  type PayrollConfigFormValues,
} from "@/components/admin/config-schema";
import type { CreateConfigResult } from "@/lib/admin/create-payroll-configuration";

export function ConfigForm({
  initialValues,
  action,
  retireSource,
}: {
  initialValues: PayrollConfigFormValues;
  action: (values: PayrollConfigFormValues) => Promise<CreateConfigResult>;
  /** Only set on /admin/new — offers to cap the source config's effectiveTo in the same transaction. */
  retireSource?: { id: string; version: string } | null;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const form = useForm<PayrollConfigFormValues>({
    resolver: zodResolver(payrollConfigFormSchema),
    defaultValues: {
      ...initialValues,
      retirePreviousConfigId: retireSource ? retireSource.id : null,
    },
  });

  async function onSubmit(values: PayrollConfigFormValues) {
    setSaveState("saving");
    const result = await action(values);
    if (!result.ok) {
      setSaveState("error");
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.length) {
          form.setError(field as keyof PayrollConfigFormValues, { message: messages[0] });
        }
      }
      return;
    }
    setSaveState("saved");
    setCreatedId(result.id);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration details</CardTitle>
            <CardDescription>
              Once created, this configuration and its rates are permanent — only
              the active/effective-to fields can be changed afterwards.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input placeholder="2027.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="2027 statutory rates" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective from</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective to (blank = open-ended)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sourceReference"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Source reference</FormLabel>
                  <FormControl>
                    <Input placeholder="LHDN / KWSP / PERKESO circular or gazette reference" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3 sm:col-span-2">
              <Label htmlFor="isActive">Active</Label>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            {retireSource ? (
              <div className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2">
                <FormField
                  control={form.control}
                  name="retirePreviousConfigId"
                  render={({ field }) => (
                    <Checkbox
                      id="retirePrevious"
                      checked={field.value !== null}
                      onCheckedChange={(checked) => field.onChange(checked ? retireSource.id : null)}
                    />
                  )}
                />
                <Label htmlFor="retirePrevious" className="text-sm font-normal">
                  {`Also retire ${retireSource.version} (sets its effective-to to the day before this one's effective-from)`}
                </Label>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <EpfRatesSection />
        <WageBandArraySection name="epfWageBands" title="EPF wage bands" description="Fixed-amount EPF contribution table for low-wage bands." />
        <WageBandArraySection
          name="socsoRates"
          title="SOCSO rates"
          description="Fixed-amount SOCSO contribution table, by category."
          withCategory
        />
        <WageBandArraySection name="eisRates" title="EIS rates" description="Fixed-amount EIS contribution table." />
        <TaxBracketsSection />
        <TaxReliefsSection />
        <TaxRebatesSection />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {saveState === "saving" ? "Saving…" : "Create configuration"}
          </Button>
          {saveState === "saved" && createdId ? (
            <span className="text-sm text-green-700 dark:text-green-400">
              Created.{" "}
              <Link href={`/admin/${createdId}`} className="underline">
                View it
              </Link>
              .
            </span>
          ) : saveState === "error" ? (
            <span className="text-destructive text-sm">
              Please check the highlighted fields and try again.
            </span>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
