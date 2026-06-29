/**
 * Admin Audit Logging Helper
 *
 * Provides a centralized function to record administrative actions
 * into the AuditLog table for compliance and traceability.
 */

import prisma from "@/lib/db";

export type AuditLogType = "USER_ACT" | "MON_ACT" | "SYS_EVNT";

export async function logAdminAction(
  userId: string | null,
  logType: AuditLogType,
  action: string,
  details: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        logType,
        action,
        details,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error("[AUDIT] Failed to log admin action:", error);
  }
}
