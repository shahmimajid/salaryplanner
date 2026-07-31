import Decimal from "decimal.js";
import type {
  CitizenshipStatus,
  Money,
  PayrollConfigSnapshot,
  ResidencyStatus,
  SocsoCategory,
} from "../types";
import payrollConfigJson from "../../../../prisma/seed-data/payroll-config.default.v2026.1.json";

// JSON module imports widen enum-like string fields to `string`, so the raw
// import is cast to this shape once, matching prisma/seed.ts's equivalent cast.
interface LocalPayrollConfig {
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  epfRates: Array<{
    citizenshipStatus: CitizenshipStatus;
    minAge: number | null;
    maxAge: number | null;
    employeeRatePercent: number;
    employerRatePercent: number;
  }>;
  epfWageBands: Array<{
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  socsoRates: Array<{
    category: SocsoCategory;
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  eisRates: Array<{
    wageFrom: number;
    wageTo: number | null;
    employeeContribution: number;
    employerContribution: number;
  }>;
  taxBrackets: Array<{
    residencyStatus: ResidencyStatus;
    chargeableIncomeFrom: number;
    chargeableIncomeTo: number | null;
    ratePercent: number;
    cumulativeTaxBase: number;
  }>;
  taxReliefs: Array<{ code: string; maxAmount: number }>;
  taxRebates: Array<{
    code: string;
    amount: number | null;
    incomeThreshold: number | null;
  }>;
}

const localConfig = payrollConfigJson as LocalPayrollConfig;

function money(value: number): Money {
  return new Decimal(value);
}

function moneyOrNull(value: number | null): Money | null {
  return value === null ? null : money(value);
}

function buildSnapshot(): PayrollConfigSnapshot {
  return {
    version: localConfig.version,
    effectiveFrom: localConfig.effectiveFrom,
    effectiveTo: localConfig.effectiveTo,
    epfRates: localConfig.epfRates.map((r) => ({
      citizenshipStatus: r.citizenshipStatus,
      minAge: r.minAge,
      maxAge: r.maxAge,
      employeeRatePercent: money(r.employeeRatePercent),
      employerRatePercent: money(r.employerRatePercent),
    })),
    epfWageBands: localConfig.epfWageBands.map((b) => ({
      wageFrom: money(b.wageFrom),
      wageTo: moneyOrNull(b.wageTo),
      employeeContribution: money(b.employeeContribution),
      employerContribution: money(b.employerContribution),
    })),
    socsoRates: localConfig.socsoRates.map((r) => ({
      category: r.category,
      wageFrom: money(r.wageFrom),
      wageTo: moneyOrNull(r.wageTo),
      employeeContribution: money(r.employeeContribution),
      employerContribution: money(r.employerContribution),
    })),
    eisRates: localConfig.eisRates.map((r) => ({
      wageFrom: money(r.wageFrom),
      wageTo: moneyOrNull(r.wageTo),
      employeeContribution: money(r.employeeContribution),
      employerContribution: money(r.employerContribution),
    })),
    taxBrackets: localConfig.taxBrackets.map((t) => ({
      residencyStatus: t.residencyStatus,
      chargeableIncomeFrom: money(t.chargeableIncomeFrom),
      chargeableIncomeTo: moneyOrNull(t.chargeableIncomeTo),
      ratePercent: money(t.ratePercent),
      cumulativeTaxBase: money(t.cumulativeTaxBase),
    })),
    taxReliefs: localConfig.taxReliefs.map((r) => ({
      code: r.code,
      maxAmount: money(r.maxAmount),
    })),
    taxRebates: localConfig.taxRebates.map((r) => ({
      code: r.code,
      amount: moneyOrNull(r.amount),
      incomeThreshold: moneyOrNull(r.incomeThreshold),
    })),
  };
}

// Computed once at module evaluation time — the seed file never changes at
// runtime, so repeated calls return the same cached snapshot rather than
// re-parsing/re-hydrating Decimals on every request.
const CACHED_CONFIG = buildSnapshot();

/**
 * Loads the payroll configuration from the local seed JSON file rather
 * than the database — the "run locally without an account" privacy mode
 * (spec §12). No Prisma/network involved.
 */
export function loadLocalPayrollConfig(): PayrollConfigSnapshot {
  return CACHED_CONFIG;
}
