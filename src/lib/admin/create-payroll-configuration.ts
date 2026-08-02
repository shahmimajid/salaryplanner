import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/admin/audit-log";
import {
  payrollConfigFormSchema,
  type PayrollConfigFormValues,
} from "@/components/admin/config-schema";

export type CreateConfigResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

function dayBefore(isoDate: string): Date {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date;
}

/**
 * PayrollConfiguration and its 7 child arrays are immutable once created
 * (no update path exists for them anywhere — see updateConfigLifecycle for
 * the only permitted post-creation mutation, which never touches this
 * data). Creating a new version + retiring its source (if requested) +
 * the audit log entry all happen in one transaction, so a partial write
 * can never leave the config list in an inconsistent state.
 */
export async function createPayrollConfiguration(
  userId: string,
  input: PayrollConfigFormValues,
): Promise<CreateConfigResult> {
  const parsed = payrollConfigFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  try {
    const configId = await prisma.$transaction(async (tx) => {
      const config = await tx.payrollConfiguration.create({
        data: {
          version: value.version,
          label: value.label,
          effectiveFrom: new Date(value.effectiveFrom),
          effectiveTo: value.effectiveTo ? new Date(value.effectiveTo) : null,
          isActive: value.isActive,
          sourceReference: value.sourceReference,
          notes: value.notes,
          createdById: userId,
          epfRates: { create: value.epfRates },
          epfWageBands: { create: value.epfWageBands },
          socsoRates: { create: value.socsoRates },
          eisRates: { create: value.eisRates },
          taxBrackets: { create: value.taxBrackets },
          taxReliefs: { create: value.taxReliefs },
          taxRebates: { create: value.taxRebates },
        },
      });

      if (value.retirePreviousConfigId) {
        await tx.payrollConfiguration.update({
          where: { id: value.retirePreviousConfigId },
          data: { effectiveTo: dayBefore(value.effectiveFrom) },
        });
      }

      await writeAuditLog(tx, {
        userId,
        action: "CONFIG_CHANGE",
        entityType: "PayrollConfiguration",
        entityId: config.id,
        changesJson: value,
      });

      return config.id;
    });

    return { ok: true, id: configId };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        fieldErrors: { version: ["This version already exists."] },
      };
    }
    throw error;
  }
}
