import Decimal from "decimal.js";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Money, PayrollConfigSnapshot } from "../types";

export interface ResolveConfigInput {
  effectiveDate: string; // ISO date — typically the SalaryEntry.payrollMonth
}

/**
 * Prisma's generated Decimal (from @prisma/client/runtime) is a distinct
 * class from decimal.js's Decimal, even though structurally compatible —
 * always convert explicitly via a string round-trip, never assume identity.
 */
function toMoney(value: Prisma.Decimal): Money {
  return new Decimal(value.toString());
}

function toMoneyOrNull(value: Prisma.Decimal | null | undefined): Money | null {
  return value === null || value === undefined ? null : toMoney(value);
}

// Exported so src/lib/admin/load-config-for-edit.ts can reuse the same
// 7-key include shape rather than duplicating it.
export const CONFIG_INCLUDE = {
  epfRates: true,
  epfWageBands: true,
  socsoRates: true,
  eisRates: true,
  taxBrackets: true,
  taxReliefs: true,
  taxRebates: true,
} satisfies Prisma.PayrollConfigurationInclude;

type ConfigWithRates = Prisma.PayrollConfigurationGetPayload<{ include: typeof CONFIG_INCLUDE }>;

function mapConfigToSnapshot(config: ConfigWithRates): PayrollConfigSnapshot {
  return {
    id: config.id,
    version: config.version,
    effectiveFrom: config.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: config.effectiveTo ? config.effectiveTo.toISOString().slice(0, 10) : null,
    epfRates: config.epfRates.map((r) => ({
      citizenshipStatus: r.citizenshipStatus,
      minAge: r.minAge,
      maxAge: r.maxAge,
      employeeRatePercent: toMoney(r.employeeRatePercent),
      employerRatePercent: toMoney(r.employerRatePercent),
      employerRateThreshold: toMoneyOrNull(r.employerRateThreshold),
      employerRateAbovePercent: toMoneyOrNull(r.employerRateAbovePercent),
    })),
    epfWageBands: config.epfWageBands.map((b) => ({
      wageFrom: toMoney(b.wageFrom),
      wageTo: toMoneyOrNull(b.wageTo),
      employeeContribution: toMoney(b.employeeContribution),
      employerContribution: toMoney(b.employerContribution),
    })),
    socsoRates: config.socsoRates.map((r) => ({
      category: r.category,
      wageFrom: toMoney(r.wageFrom),
      wageTo: toMoneyOrNull(r.wageTo),
      employeeContribution: toMoney(r.employeeContribution),
      employerContribution: toMoney(r.employerContribution),
    })),
    eisRates: config.eisRates.map((r) => ({
      wageFrom: toMoney(r.wageFrom),
      wageTo: toMoneyOrNull(r.wageTo),
      employeeContribution: toMoney(r.employeeContribution),
      employerContribution: toMoney(r.employerContribution),
    })),
    taxBrackets: config.taxBrackets.map((t) => ({
      residencyStatus: t.residencyStatus,
      chargeableIncomeFrom: toMoney(t.chargeableIncomeFrom),
      chargeableIncomeTo: toMoneyOrNull(t.chargeableIncomeTo),
      ratePercent: toMoney(t.ratePercent),
      cumulativeTaxBase: toMoney(t.cumulativeTaxBase),
    })),
    taxReliefs: config.taxReliefs.map((r) => ({
      code: r.code,
      maxAmount: toMoney(r.maxAmount),
    })),
    taxRebates: config.taxRebates.map((r) => ({
      code: r.code,
      amount: toMoneyOrNull(r.amount),
      incomeThreshold: toMoneyOrNull(r.incomeThreshold),
    })),
  };
}

/**
 * Loads the single active PayrollConfiguration (and its rate/bracket/relief/
 * rebate rows) whose effective range covers the given date, and flattens it
 * into a PayrollConfigSnapshot.
 */
export async function resolveConfig(input: ResolveConfigInput): Promise<PayrollConfigSnapshot> {
  const date = new Date(input.effectiveDate);

  const config = await prisma.payrollConfiguration.findFirst({
    where: {
      isActive: true,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
    },
    // Latest applicable version wins if ranges ever overlap (docs/assumptions.md #13).
    orderBy: { effectiveFrom: "desc" },
    include: CONFIG_INCLUDE,
  });

  if (!config) {
    throw new Error(`No active payroll configuration found for effective date ${input.effectiveDate}.`);
  }

  return mapConfigToSnapshot(config);
}

/**
 * Loads a specific PayrollConfiguration by id, regardless of whether it's
 * still active — used to recompute a historical calculation against the
 * exact configuration version it originally used (docs/architecture.md's
 * versioned-configuration guarantee), not whatever a date-based lookup
 * would currently resolve to.
 */
export async function resolveConfigById(id: string): Promise<PayrollConfigSnapshot> {
  const config = await prisma.payrollConfiguration.findUnique({
    where: { id },
    include: CONFIG_INCLUDE,
  });

  if (!config) {
    throw new Error(`No payroll configuration found with id ${id}.`);
  }

  return mapConfigToSnapshot(config);
}
