import { prisma } from "./prisma";

export async function auditLog(
  action: string,
  entity: string,
  entityId?: string | null,
  userId?: string | null,
  details?: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
      },
    });
  } catch {
    // Don't block the main flow if audit logging fails
  }
}
