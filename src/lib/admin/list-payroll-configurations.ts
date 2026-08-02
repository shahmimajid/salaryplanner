import { prisma } from "@/lib/db/prisma";

export interface PayrollConfigurationListItem {
  id: string;
  version: string;
  label: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdByEmail: string;
  createdAt: Date;
}

/** Scalars + createdBy.email only — no nested rate arrays, keeps the list page light. */
export async function listPayrollConfigurations(): Promise<PayrollConfigurationListItem[]> {
  const rows = await prisma.payrollConfiguration.findMany({
    orderBy: { effectiveFrom: "desc" },
    include: { createdBy: { select: { email: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    label: row.label,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: row.effectiveTo ? row.effectiveTo.toISOString().slice(0, 10) : null,
    isActive: row.isActive,
    createdByEmail: row.createdBy.email,
    createdAt: row.createdAt,
  }));
}
