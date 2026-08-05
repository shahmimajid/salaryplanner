import { z } from "zod";

// Plain z.number()/z.enum() throughout, no .coerce()/.default() — same
// convention as src/components/calculator/schema.ts, keeps z.input/
// z.output identical for single-generic useForm<T>() typing.
export const profileFormSchema = z.object({
  citizenshipStatus: z.enum(["CITIZEN", "PERMANENT_RESIDENT", "NON_CITIZEN"]),
  isBelow60: z.boolean(),
  residencyStatus: z.enum(["RESIDENT", "NON_RESIDENT"]),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]),
  spouseHasIncome: z.boolean(),
  numberOfChildren: z.number().int().min(0).max(20),
  childReliefClaims: z.array(
    z.object({
      belowAge18: z.boolean(),
      reliefPercentageClaimed: z.number().min(0).max(100),
    }),
  ),
  epfEmployeeRatePercent: z.number().min(0).max(100),
  lindung24JamOptIn: z.boolean(),
  zakatEnabled: z.boolean(),
  claimsSocsoRelief: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
