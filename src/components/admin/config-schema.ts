import { z } from "zod";

// Plain z.number()/z.enum() throughout, no .coerce()/.default() — same
// convention as src/components/profile/profile-schema.ts, keeps z.input/
// z.output identical for single-generic useForm<T>() typing.

export const epfRateRowSchema = z.object({
  citizenshipStatus: z.enum(["CITIZEN", "PERMANENT_RESIDENT", "NON_CITIZEN"]),
  minAge: z.number().int().min(0).max(120).nullable(),
  maxAge: z.number().int().min(0).max(120).nullable(),
  employeeRatePercent: z.number().min(0).max(100),
  employerRatePercent: z.number().min(0).max(100),
  notes: z.string().nullable(),
});

// Shared shape — reused verbatim for epfWageBands and eisRates, which are
// structurally identical.
export const wageBandRowSchema = z.object({
  wageFrom: z.number().min(0),
  wageTo: z.number().min(0).nullable(),
  employeeContribution: z.number().min(0),
  employerContribution: z.number().min(0),
});

export const socsoRateRowSchema = wageBandRowSchema.extend({
  category: z.enum(["CATEGORY_1", "CATEGORY_2"]),
});

export const taxBracketRowSchema = z.object({
  residencyStatus: z.enum(["RESIDENT", "NON_RESIDENT"]),
  chargeableIncomeFrom: z.number().min(0),
  chargeableIncomeTo: z.number().min(0).nullable(),
  ratePercent: z.number().min(0).max(100),
  cumulativeTaxBase: z.number().min(0),
});

export const taxReliefRowSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  maxAmount: z.number().min(0),
  description: z.string().nullable(),
});

export const taxRebateRowSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().min(0).nullable(),
  incomeThreshold: z.number().min(0).nullable(),
  description: z.string().nullable(),
});

export const payrollConfigFormSchema = z.object({
  version: z.string().min(1),
  label: z.string().min(1),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().nullable(),
  isActive: z.boolean(),
  sourceReference: z.string().min(1),
  notes: z.string().nullable(),
  epfRates: z.array(epfRateRowSchema).min(1),
  epfWageBands: z.array(wageBandRowSchema).min(1),
  socsoRates: z.array(socsoRateRowSchema).min(1),
  eisRates: z.array(wageBandRowSchema).min(1),
  taxBrackets: z.array(taxBracketRowSchema).min(1),
  taxReliefs: z.array(taxReliefRowSchema).min(1),
  taxRebates: z.array(taxRebateRowSchema).min(1),
  // Not persisted on PayrollConfiguration itself — an admin.new-only
  // instruction consumed by createPayrollConfiguration to also cap the
  // source config's effectiveTo in the same transaction.
  retirePreviousConfigId: z.string().nullable(),
});

export type PayrollConfigFormValues = z.infer<typeof payrollConfigFormSchema>;

export const configLifecycleFormSchema = z.object({
  isActive: z.boolean(),
  effectiveTo: z.string().nullable(),
});

export type ConfigLifecycleFormValues = z.infer<typeof configLifecycleFormSchema>;
