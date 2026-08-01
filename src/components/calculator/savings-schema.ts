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
