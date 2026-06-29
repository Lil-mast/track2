import type { AuditLog } from "@/types/audit";
import type { RecoveryRecommendation } from "@/types/recovery";
import { mockAuditLogs as seedAuditLogs } from "./audit-logs";
import { mockRecommendations as seedRecommendations } from "./recommendations";

/** In-memory store for runtime mutations (audit logs, recommendations, etc.) */
let auditLogs: AuditLog[] = [...seedAuditLogs];
let auditCounter = auditLogs.length;

let runtimeRecommendations: RecoveryRecommendation[] = [...seedRecommendations];
let recCounter = runtimeRecommendations.length;

// ─── Audit Logs ───────────────────────────────────────────────────────────────

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

// ─── Recommendations ──────────────────────────────────────────────────────────

export function getRuntimeRecommendations(): RecoveryRecommendation[] {
  return runtimeRecommendations;
}

export function appendRecommendation(
  entry: Omit<RecoveryRecommendation, "id">
): RecoveryRecommendation {
  recCounter += 1;
  const rec: RecoveryRecommendation = {
    ...entry,
    id: `rec_${String(recCounter).padStart(3, "0")}`,
  };
  runtimeRecommendations = [rec, ...runtimeRecommendations];
  return rec;
}

export function updateRecommendationStatus(
  id: string,
  status: RecoveryRecommendation["status"],
  reviewedBy?: string
): RecoveryRecommendation | null {
  let found: RecoveryRecommendation | null = null;
  runtimeRecommendations = runtimeRecommendations.map((r) => {
    if (r.id !== id) return r;
    found = {
      ...r,
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy ?? r.reviewedBy,
      ...(status === "executed" ? { executedAt: new Date().toISOString() } : {}),
    };
    return found;
  });
  return found;
}

// ─── Reset ────────────────────────────────────────────────────────────────────

export function resetRuntimeStore(): void {
  auditLogs = [...seedAuditLogs];
  auditCounter = seedAuditLogs.length;
  runtimeRecommendations = [...seedRecommendations];
  recCounter = seedRecommendations.length;
}
