import type Decimal from "decimal.js";

/**
 * All monetary and rate values in the calculation engine use decimal.js
 * Decimal (not `number`) to avoid floating-point rounding errors; this
 * mirrors Prisma's own Decimal representation so DB round-tripping is safe.
 */
export type Money = Decimal;

export type ResidencyStatus = "RESIDENT" | "NON_RESIDENT";
export type CitizenshipStatus =
  "CITIZEN" | "PERMANENT_RESIDENT" | "NON_CITIZEN";
export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
export type SocsoCategory = "CATEGORY_1" | "CATEGORY_2";
export type WeekendSupportPaymentMethod =
  "FIXED_PER_DAY" | "FIXED_MONTHLY" | "MANUAL_TOTAL";
export type SavingsCategory =
  | "HOUSING"
  | "CAR"
  | "UTILITIES"
  | "FOOD"
  | "CHILDREN"
  | "INSURANCE_TAKAFUL"
  | "DEBT"
  | "INVESTMENT"
  | "EMERGENCY_FUND"
  | "GENERAL_SAVINGS"
  | "WEEKEND_SUPPORT_SAVINGS"
  | "PERSONAL_SPENDING";
export type AllocationType = "FIXED_AMOUNT" | "PERCENTAGE";

/**
 * Fully-resolved statutory config for one effective date — the flattened,
 * engine-friendly shape produced by `resolveConfig()` from the
 * PayrollConfiguration relational tables (or directly from the seed JSON).
 */
export interface PayrollConfigSnapshot {
  // Only set when resolved from the database (resolveConfig/resolveConfigById)
  // — local mode's snapshot (load-local-config.ts) has no DB row to point to.
  id?: string;
  version: string;
  effectiveFrom: string; // ISO date
  effectiveTo: string | null;
  epfRates: EpfRateRow[];
  epfWageBands: EpfWageBandRow[];
  socsoRates: SocsoRateRow[];
  eisRates: EisRateRow[];
  taxBrackets: TaxBracketRow[];
  taxReliefs: TaxReliefRow[];
  taxRebates: TaxRebateRow[];
}

export interface EpfRateRow {
  citizenshipStatus: CitizenshipStatus;
  minAge: number | null;
  maxAge: number | null;
  employeeRatePercent: Money;
  employerRatePercent: Money;
  // KWSP's employer rate is wage-tiered for some rows (e.g. 13% at wages
  // <=RM5,000, 12% above) — when both are set, wages strictly above
  // employerRateThreshold use employerRateAbovePercent instead of
  // employerRatePercent. Optional so existing fixtures/config rows that
  // predate this field don't need updating for the flat-rate case.
  employerRateThreshold?: Money | null;
  employerRateAbovePercent?: Money | null;
}

export interface EpfWageBandRow {
  // KWSP publishes a separate fixed-amount table per Part (citizenship +
  // age band) — same discriminator convention as EpfRateRow (null age
  // bounds = universal, maxAge set = below 60, minAge set = 60+).
  citizenshipStatus: CitizenshipStatus;
  minAge: number | null;
  maxAge: number | null;
  wageFrom: Money;
  wageTo: Money | null;
  employeeContribution: Money;
  employerContribution: Money;
}

export interface SocsoRateRow {
  category: SocsoCategory;
  wageFrom: Money;
  wageTo: Money | null;
  employeeContribution: Money;
  employerContribution: Money;
}

export interface EisRateRow {
  wageFrom: Money;
  wageTo: Money | null;
  employeeContribution: Money;
  employerContribution: Money;
}

export interface TaxBracketRow {
  residencyStatus: ResidencyStatus;
  chargeableIncomeFrom: Money;
  chargeableIncomeTo: Money | null;
  ratePercent: Money;
  cumulativeTaxBase: Money;
}

export interface TaxReliefRow {
  code: string;
  maxAmount: Money;
}

export interface TaxRebateRow {
  code: string;
  amount: Money | null;
  incomeThreshold: Money | null;
}

/** Subset of PayrollProfile relevant to calculations. */
export interface PayrollProfileSnapshot {
  citizenshipStatus: CitizenshipStatus;
  isBelow60: boolean;
  residencyStatus: ResidencyStatus;
  maritalStatus: MaritalStatus;
  spouseHasIncome: boolean;
  numberOfChildren: number;
  childReliefClaims: Array<{
    belowAge18: boolean;
    reliefPercentageClaimed: number;
  }>;
  epfEmployeeRatePercent: Money;
  lindung24JamOptIn: boolean;
  zakatEnabled: boolean;
  claimsSocsoRelief: boolean;
}
