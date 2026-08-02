import { prisma } from "@/lib/db/prisma";
import { CONFIG_INCLUDE } from "@/lib/payroll/config/resolve-config";
import type { PayrollConfigFormValues } from "@/components/admin/config-schema";

/**
 * Full DB row shape (Decimals converted to plain numbers), NOT the leaner
 * engine snapshot resolve-config.ts's mapConfigToSnapshot produces — this
 * keeps TaxRelief.label/description, TaxRebate.label/description,
 * EPFRate.notes etc. that the snapshot mapper deliberately drops, since
 * an admin editing/duplicating a config needs the full row, not just what
 * the calculation engine consumes. Used by both /admin/[id]'s read-only
 * detail view and /admin/new's duplicate-source loader. Returns null if
 * not found (both call sites 404 via notFound()).
 */
export async function loadPayrollConfigurationForEdit(
  id: string,
): Promise<PayrollConfigFormValues | null> {
  const config = await prisma.payrollConfiguration.findUnique({
    where: { id },
    include: CONFIG_INCLUDE,
  });
  if (!config) return null;

  return {
    version: config.version,
    label: config.label,
    effectiveFrom: config.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: config.effectiveTo ? config.effectiveTo.toISOString().slice(0, 10) : null,
    isActive: config.isActive,
    sourceReference: config.sourceReference,
    notes: config.notes,
    epfRates: config.epfRates.map((r) => ({
      citizenshipStatus: r.citizenshipStatus,
      minAge: r.minAge,
      maxAge: r.maxAge,
      employeeRatePercent: Number(r.employeeRatePercent),
      employerRatePercent: Number(r.employerRatePercent),
      employerRateThreshold: r.employerRateThreshold ? Number(r.employerRateThreshold) : null,
      employerRateAbovePercent: r.employerRateAbovePercent ? Number(r.employerRateAbovePercent) : null,
      notes: r.notes,
    })),
    epfWageBands: config.epfWageBands.map((b) => ({
      wageFrom: Number(b.wageFrom),
      wageTo: b.wageTo ? Number(b.wageTo) : null,
      employeeContribution: Number(b.employeeContribution),
      employerContribution: Number(b.employerContribution),
    })),
    socsoRates: config.socsoRates.map((r) => ({
      category: r.category,
      wageFrom: Number(r.wageFrom),
      wageTo: r.wageTo ? Number(r.wageTo) : null,
      employeeContribution: Number(r.employeeContribution),
      employerContribution: Number(r.employerContribution),
    })),
    eisRates: config.eisRates.map((r) => ({
      wageFrom: Number(r.wageFrom),
      wageTo: r.wageTo ? Number(r.wageTo) : null,
      employeeContribution: Number(r.employeeContribution),
      employerContribution: Number(r.employerContribution),
    })),
    taxBrackets: config.taxBrackets.map((t) => ({
      residencyStatus: t.residencyStatus,
      chargeableIncomeFrom: Number(t.chargeableIncomeFrom),
      chargeableIncomeTo: t.chargeableIncomeTo ? Number(t.chargeableIncomeTo) : null,
      ratePercent: Number(t.ratePercent),
      cumulativeTaxBase: Number(t.cumulativeTaxBase),
    })),
    taxReliefs: config.taxReliefs.map((r) => ({
      code: r.code,
      label: r.label,
      maxAmount: Number(r.maxAmount),
      description: r.description,
    })),
    taxRebates: config.taxRebates.map((r) => ({
      code: r.code,
      label: r.label,
      amount: r.amount ? Number(r.amount) : null,
      incomeThreshold: r.incomeThreshold ? Number(r.incomeThreshold) : null,
      description: r.description,
    })),
    retirePreviousConfigId: null,
  };
}
