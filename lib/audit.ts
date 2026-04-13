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

// ─── Security-specific audit events ───────────────────────────────────

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "RATE_LIMITED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_CHANGED"
  | "MAGIC_LINK_REQUESTED"
  | "ACCOUNT_CREATED"
  | "ACCOUNT_LOCKED"
  | "SUSPICIOUS_ACTIVITY"
  | "UNAUTHORIZED_ACCESS";

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const SEVERITY_MAP: Record<SecurityEventType, SecuritySeverity> = {
  LOGIN_SUCCESS: "LOW",
  LOGIN_FAILED: "MEDIUM",
  RATE_LIMITED: "HIGH",
  PASSWORD_RESET_REQUESTED: "LOW",
  PASSWORD_CHANGED: "MEDIUM",
  MAGIC_LINK_REQUESTED: "LOW",
  ACCOUNT_CREATED: "LOW",
  ACCOUNT_LOCKED: "HIGH",
  SUSPICIOUS_ACTIVITY: "CRITICAL",
  UNAUTHORIZED_ACCESS: "CRITICAL",
};

interface SecurityAuditOptions {
  event: SecurityEventType;
  userId?: string | null;
  ip?: string | null;
  email?: string | null;
  details?: string | null;
  userAgent?: string | null;
}

/**
 * Log a security-specific event with severity classification.
 * Includes IP address and user-agent for forensic analysis.
 */
export async function securityAudit(opts: SecurityAuditOptions) {
  const severity = SEVERITY_MAP[opts.event] ?? "MEDIUM";
  const detailParts: string[] = [];

  detailParts.push(`[${severity}]`);
  if (opts.ip) detailParts.push(`IP: ${opts.ip}`);
  if (opts.email) detailParts.push(`Email: ${opts.email}`);
  if (opts.userAgent) detailParts.push(`UA: ${opts.userAgent.slice(0, 120)}`);
  if (opts.details) detailParts.push(opts.details);

  await auditLog(
    opts.event,
    "Security",
    null,
    opts.userId ?? null,
    detailParts.join(" | "),
  );

  // Log high/critical events to console for immediate visibility
  if (severity === "HIGH" || severity === "CRITICAL") {
    console.warn(`[SECURITY:${severity}] ${opts.event}`, {
      ip: opts.ip,
      email: opts.email,
      details: opts.details,
    });
  }
}
