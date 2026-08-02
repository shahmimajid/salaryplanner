import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/admin/audit-log";
import {
  configLifecycleFormSchema,
  type ConfigLifecycleFormValues,
} from "@/components/admin/config-schema";

export type LifecycleResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> };

/**
 * Scalar-only update — isActive/effectiveTo on the parent row, never the 7
 * child rate/bracket arrays. This is the ONLY mutation ever permitted on
 * an existing PayrollConfiguration; see createPayrollConfiguration's doc
 * comment for why the nested data itself is permanently immutable.
 */
export async function updateConfigLifecycle(
  userId: string,
  id: string,
  input: ConfigLifecycleFormValues,
): Promise<LifecycleResult> {
  const parsed = configLifecycleFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const value = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.payrollConfiguration.update({
      where: { id },
      data: {
        isActive: value.isActive,
        effectiveTo: value.effectiveTo ? new Date(value.effectiveTo) : null,
      },
    });

    await writeAuditLog(tx, {
      userId,
      action: "CONFIG_CHANGE",
      entityType: "PayrollConfiguration",
      entityId: id,
      changesJson: value,
    });
  });

  return { ok: true };
}
