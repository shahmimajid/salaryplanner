"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  configLifecycleFormSchema,
  type ConfigLifecycleFormValues,
} from "@/components/admin/config-schema";
import type { LifecycleResult } from "@/lib/admin/update-config-lifecycle";

export function ConfigLifecycleForm({
  initialValues,
  action,
}: {
  initialValues: ConfigLifecycleFormValues;
  action: (values: ConfigLifecycleFormValues) => Promise<LifecycleResult>;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const form = useForm<ConfigLifecycleFormValues>({
    resolver: zodResolver(configLifecycleFormSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: ConfigLifecycleFormValues) {
    setSaveState("saving");
    const result = await action(values);
    if (!result.ok) {
      setSaveState("error");
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.length) {
          form.setError(field as keyof ConfigLifecycleFormValues, { message: messages[0] });
        }
      }
      return;
    }
    setSaveState("saved");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lifecycle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel htmlFor="lifecycle-isActive">Active</FormLabel>
                    <FormControl>
                      <Switch
                        id="lifecycle-isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="lifecycle-effectiveTo">Effective to (blank = open-ended)</Label>
                  <FormControl>
                    <Input
                      id="lifecycle-effectiveTo"
                      type="date"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {saveState === "saving" ? "Saving…" : "Save"}
              </Button>
              {saveState === "saved" ? (
                <span className="text-sm text-green-700 dark:text-green-400">Saved.</span>
              ) : saveState === "error" ? (
                <span className="text-destructive text-sm">Something went wrong.</span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
