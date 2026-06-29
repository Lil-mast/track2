import { appendAuditLog } from "@/data/mock/runtime-store";
import { isAuroraActive } from "@/config/aws";
import { query } from "@/lib/aurora/db";
import type { RecoveryEngineWorkflowResult } from "@/types/recovery-engine";
import { recoveryActionLabels } from "@/lib/labels";

export function logRecoveryWorkflow(
  result: RecoveryEngineWorkflowResult,
  requestMeta?: { ipAddress?: string; userAgent?: string }
): string {
  const description = `Recovery engine completed: AI recommended "${result.aiRecommendation.recommendedAction}" (risk ${result.aiRecommendation.riskScore}), rules validated to "${recoveryActionLabels[result.finalAction.action]}". ${result.ruleValidation.requiresManualApproval ? "Manual approval required." : "Eligible for auto-execution."}`;
  const entityLabel = `AI Recovery — ${result.loanNumber}`;

  if (isAuroraActive()) {
    // Fire-and-forget: write the audit log to Aurora asynchronously.
    // We generate a deterministic id from the workflowId so we can return it
    // immediately without waiting for the DB round-trip.
    query(
      `INSERT INTO audit_logs
         (lender_id, user_id, user_name, user_email, action, entity_type,
          entity_id, entity_label, description, ip_address, user_agent)
       VALUES
         (:lenderId, 'system_ai', 'RecoverIQ AI Engine', 'system@recoveriq.ai',
          CAST('create' AS audit_action),
          CAST('recommendation' AS audit_entity_type),
          :entityId, :entityLabel, :description, :ipAddress, :userAgent)`,
      {
        lenderId: result.lenderId,
        entityId: result.workflowId,
        entityLabel,
        description,
        ipAddress: requestMeta?.ipAddress ?? "127.0.0.1",
        userAgent: requestMeta?.userAgent ?? "RecoverIQ/1.0 AI-Engine",
      }
    ).catch((err) => {
      console.error("[audit-logger] Aurora audit log write failed (non-fatal):", err);
    });

    return result.workflowId;
  }

  // Mock path: write to in-memory store and return generated id.
  const log = appendAuditLog({
    lenderId: result.lenderId,
    userId: "system_ai",
    userName: "RecoverIQ AI Engine",
    userEmail: "system@recoveriq.ai",
    action: "create",
    entityType: "recommendation",
    entityId: result.workflowId,
    entityLabel,
    description,
    ipAddress: requestMeta?.ipAddress ?? "127.0.0.1",
    userAgent: requestMeta?.userAgent ?? "RecoverIQ/1.0 AI-Engine",
    metadata: {
      workflow: {
        loanId: result.loanId,
        borrowerId: result.borrowerId,
        riskScore: result.riskAssessment.score,
        riskLevel: result.riskAssessment.level,
        aiRecommendation: result.aiRecommendation,
        matchedRules: result.ruleValidation.matchedRules.map((r) => r.ruleName),
        finalAction: result.finalAction.action,
        requiresManualApproval: result.ruleValidation.requiresManualApproval,
      },
    },
  });

  return log.id;
}
