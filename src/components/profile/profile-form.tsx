"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { NumberField } from "@/components/calculator/number-field";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/components/profile/profile-schema";
import type { UpdateProfileResult } from "@/lib/profile/update-profile";

const CITIZENSHIP_LABELS: Record<ProfileFormValues["citizenshipStatus"], string> = {
  CITIZEN: "Citizen",
  PERMANENT_RESIDENT: "Permanent resident",
  NON_CITIZEN: "Non-citizen",
};

const RESIDENCY_LABELS: Record<ProfileFormValues["residencyStatus"], string> = {
  RESIDENT: "Tax resident",
  NON_RESIDENT: "Non-resident",
};

const MARITAL_LABELS: Record<ProfileFormValues["maritalStatus"], string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
};

function RadioField<T extends string>({
  name,
  label,
  labels,
}: {
  name: "citizenshipStatus" | "residencyStatus" | "maritalStatus";
  label: string;
  labels: Record<T, string>;
}) {
  const form = useFormContext<ProfileFormValues>();
  const options = Object.keys(labels) as T[];
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {options.map((option) => (
                <label
                  key={option}
                  className="border-input has-[[data-checked]]:border-primary flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <RadioGroupItem value={option} />
                  {labels[option]}
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ProfileForm({
  initialValues,
  action,
}: {
  initialValues: ProfileFormValues;
  action: (values: ProfileFormValues) => Promise<UpdateProfileResult>;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "childReliefClaims",
  });

  const maritalStatus = useWatch({ control: form.control, name: "maritalStatus" });
  const numberOfChildren = useWatch({ control: form.control, name: "numberOfChildren" });

  useEffect(() => {
    const diff = (numberOfChildren ?? 0) - fields.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        append({ belowAge18: true, reliefPercentageClaimed: 100 });
      }
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) {
        remove(fields.length - 1 - i);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfChildren]);

  async function onSubmit(values: ProfileFormValues) {
    setSaveState("saving");
    const result = await action(values);
    if (!result.ok) {
      setSaveState("error");
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.length) {
          form.setError(field as keyof ProfileFormValues, { message: messages[0] });
        }
      }
      return;
    }
    setSaveState("saved");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payroll profile</CardTitle>
            <CardDescription>
              Changes apply to future calculations only — past calculations
              keep the profile that was in effect when you saved them.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <RadioField name="citizenshipStatus" label="Citizenship" labels={CITIZENSHIP_LABELS} />
            <RadioField name="residencyStatus" label="Residency" labels={RESIDENCY_LABELS} />
            <RadioField name="maritalStatus" label="Marital status" labels={MARITAL_LABELS} />

            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Label htmlFor="isBelow60">Below age 60</Label>
              <FormField
                control={form.control}
                name="isBelow60"
                render={({ field }) => (
                  <Switch
                    id="isBelow60"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {maritalStatus === "MARRIED" ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <Label htmlFor="spouseHasIncome">Spouse has income</Label>
                <FormField
                  control={form.control}
                  name="spouseHasIncome"
                  render={({ field }) => (
                    <Switch
                      id="spouseHasIncome"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            ) : null}

            <NumberField<ProfileFormValues>
              name="numberOfChildren"
              label="Number of children"
              step="1"
            />

            <NumberField<ProfileFormValues>
              name="epfEmployeeRatePercent"
              label="EPF employee rate (%)"
              step="0.001"
            />

            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Label htmlFor="lindung24JamOptIn">LINDUNG i-Saraan/24 Jam opt-in</Label>
              <FormField
                control={form.control}
                name="lindung24JamOptIn"
                render={({ field }) => (
                  <Switch
                    id="lindung24JamOptIn"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Label htmlFor="zakatEnabled">Zakat enabled</Label>
              <FormField
                control={form.control}
                name="zakatEnabled"
                render={({ field }) => (
                  <Switch
                    id="zakatEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {fields.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Child relief claims</CardTitle>
              <CardDescription>
                Percentage of each child&apos;s relief you&apos;re claiming — split
                with a spouse if applicable. Not validated to sum to 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {fields.map((field, index) => (
                <div key={field.id} className="border-input grid gap-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`child-${index}-belowAge18`} className="text-sm">
                      Child {index + 1} — below 18
                    </Label>
                    <FormField
                      control={form.control}
                      name={`childReliefClaims.${index}.belowAge18`}
                      render={({ field: switchField }) => (
                        <Switch
                          id={`child-${index}-belowAge18`}
                          checked={switchField.value}
                          onCheckedChange={switchField.onChange}
                        />
                      )}
                    />
                  </div>
                  <NumberField<ProfileFormValues>
                    name={`childReliefClaims.${index}.reliefPercentageClaimed`}
                    label="Relief % claimed"
                    step="1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {saveState === "saving" ? "Saving…" : "Save profile"}
          </Button>
          {saveState === "saved" ? (
            <span className="text-sm text-green-700 dark:text-green-400">Saved.</span>
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
