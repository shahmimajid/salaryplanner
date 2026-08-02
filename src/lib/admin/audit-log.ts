import type { Prisma } from "@/generated/prisma/client";

export interface WriteAuditLogInput {
  userId: string;
  action: Prisma.AuditLogCreateInput["action"];
  entityType: string;
  entityId?: string;
  changesJson?: Prisma.InputJsonValue;
}

/**
 * Takes a transaction client (not the top-level prisma singleton) so every
 * caller composes this inside its own $transaction — the audit entry and
 * the actual data change succeed or fail together, never independently.
 */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: WriteAuditLogInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changesJson: input.changesJson,
    },
  });
}
