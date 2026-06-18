import { appendAuditLog } from "@/data/mock/runtime-store";
import type { RecoveryEngineWorkflowResult } from "@/types/recovery-engine";
import { recoveryActionLabels } from "@/lib/labels";

export function logRecoveryWorkflow(
  result: RecoveryEngineWorkflowResult,
  requestMeta?: { ipAddress?: string; userAgent?: string }
): string {
  const log = appendAuditLog({
    lenderId: result.lenderId,
    userId: "system_ai",
    userName: "RecoverIQ AI Engine",
    userEmail: "system@recoveriq.ai",
    action: "create",
    entityType: "recommendation",
    entityId: result.workflowId,
    entityLabel: `AI Recovery — ${result.loanNumber}`,
    description: `Recovery engine completed: AI recommended "${result.aiRecommendation.recommendedAction}" (risk ${result.aiRecommendation.riskScore}), rules validated to "${recoveryActionLabels[result.finalAction.action]}". ${result.ruleValidation.requiresManualApproval ? "Manual approval required." : "Eligible for auto-execution."}`,
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
