import { z } from "zod";

export const WEEKEND_SUPPORT_PAYMENT_METHODS = [
  "FIXED_PER_DAY",
  "FIXED_MONTHLY",
  "MANUAL_TOTAL",
] as const;

// Plain z.number() throughout (no z.coerce, no .default()) so the schema's
// input and output types are identical — NumberField already converts the
// DOM's string values to numbers before they ever reach react-hook-form
// state, and useForm's `defaultValues` (not zod) supplies the initial 0s.
// Mixing z.coerce/.default() here would split z.input/z.output and break
// the single-generic `useForm<SalaryEntryFormValues>()` typing.
export const salaryEntryFormSchema = z
  .object({
    payrollMonth: z.string().min(1, "Payroll month is required."),
    basicSalary: z.number().min(0, "Basic salary must be zero or more."),
    fixedAllowance: z.number().min(0),
    weekendSupportPaymentMethod: z.enum(WEEKEND_SUPPORT_PAYMENT_METHODS),
    weekendSupportFixedRatePerDay: z.number().min(0).optional(),
    weekendSupportDaysCount: z.number().int().min(0).optional(),
    weekendSupportFixedMonthlyAmount: z.number().min(0).optional(),
    weekendSupportManualTotalAmount: z.number().min(0).optional(),
    bonus: z.number().min(0),
    commission: z.number().min(0),
    otherTaxableIncome: z.number().min(0),
    otherNonTaxableReimbursement: z.number().min(0),
    epfAdjustment: z.number(),
    zakat: z.number().min(0),
    previousCumulativeIncomeForYear: z.number().min(0),
    previousCumulativePcbPaid: z.number().min(0),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.weekendSupportPaymentMethod === "FIXED_PER_DAY" &&
      (value.weekendSupportFixedRatePerDay === undefined ||
        value.weekendSupportDaysCount === undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["weekendSupportFixedRatePerDay"],
        message:
          "Rate per day and number of days are required for this payment method.",
      });
    }
    if (
      value.weekendSupportPaymentMethod === "FIXED_MONTHLY" &&
      value.weekendSupportFixedMonthlyAmount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["weekendSupportFixedMonthlyAmount"],
        message: "Fixed monthly amount is required for this payment method.",
      });
    }
    if (
      value.weekendSupportPaymentMethod === "MANUAL_TOTAL" &&
      value.weekendSupportManualTotalAmount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["weekendSupportManualTotalAmount"],
        message: "Total support allowance is required for this payment method.",
      });
    }
  });

export type SalaryEntryFormValues = z.infer<typeof salaryEntryFormSchema>;
