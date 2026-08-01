import { z } from "zod";
import { SAVINGS_CATEGORIES } from "@/components/calculator/savings-category-meta";

const allocationEntrySchema = z.object({
  allocationType: z.enum(["FIXED_AMOUNT", "PERCENTAGE"]),
  amount: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

// Built from SAVINGS_CATEGORIES so the shape can't drift from the
// SavingsCategory union — same plain-z.number() convention as
// schema.ts (no coerce/default; NumberField handles DOM string<->number).
const allocationsShape = SAVINGS_CATEGORIES.reduce(
  (shape, category) => {
    shape[category] = allocationEntrySchema;
    return shape;
  },
  {} as Record<
    (typeof SAVINGS_CATEGORIES)[number],
    typeof allocationEntrySchema
  >,
);

export const savingsPlannerFormSchema = z.object({
  monthlySavingsTarget: z.number().min(0).optional(),
  saveAllNetWeekendSupport: z.boolean(),
  allocations: z.object(allocationsShape),
});

export type SavingsPlannerFormValues = z.infer<typeof savingsPlannerFormSchema>;

// Same shape as savingsPlannerFormSchema plus the target SalaryEntry — the
// server action's own validation boundary, kept distinct from the form
// schema since the form never collects/sends salaryEntryId itself (it's
// threaded in separately from SalaryEntryForm's own saved-entry state).
export const savingsPlanPersistSchema = savingsPlannerFormSchema.extend({
  salaryEntryId: z.string().min(1),
});

export type SavingsPlanPersistInput = z.infer<typeof savingsPlanPersistSchema>;

export function defaultSavingsPlannerValues(): SavingsPlannerFormValues {
  return {
    saveAllNetWeekendSupport: false,
    allocations: SAVINGS_CATEGORIES.reduce(
      (values, category) => {
        values[category] = {
          allocationType: "FIXED_AMOUNT",
          amount: 0,
          percentage: 0,
        };
        return values;
      },
      {} as SavingsPlannerFormValues["allocations"],
    ),
  };
}
