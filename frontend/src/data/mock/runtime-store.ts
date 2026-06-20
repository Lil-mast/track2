import type { AuditLog } from "@/types/audit";
import { mockAuditLogs as seedAuditLogs } from "./audit-logs";

/** In-memory store for runtime mutations (audit logs, etc.) */
let auditLogs: AuditLog[] = [...seedAuditLogs];
let auditCounter = auditLogs.length;

export function getAuditLogs(): AuditLog[] {
  return auditLogs;
}

export function appendAuditLog(
  entry: Omit<AuditLog, "id" | "createdAt">
): AuditLog {
  auditCounter += 1;
  const log: AuditLog = {
    ...entry,
    id: `audit_${String(auditCounter).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  auditLogs = [log, ...auditLogs];
  return log;
}

export function resetRuntimeStore(): void {
  auditLogs = [...seedAuditLogs];
  auditCounter = seedAuditLogs.length;
}
