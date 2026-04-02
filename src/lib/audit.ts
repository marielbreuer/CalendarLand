import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "login"
  | "login_failed"
  | "register"
  | "invite_used"
  | "invite_created"
  | "user_deleted"
  | "booking_created";

/**
 * Write an audit log entry. Errors are swallowed so a logging
 * failure never breaks the calling request.
 */
export async function auditLog(
  action: AuditAction,
  options: {
    userId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  } = {}
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId ?? null,
        details: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress ?? null,
      },
    });
  } catch {
    console.error(`[audit] Failed to log action: ${action}`);
  }
}
