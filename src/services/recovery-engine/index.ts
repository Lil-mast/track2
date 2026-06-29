import { getDataRepository } from "@/services";
import { isAuroraActive } from "@/config/aws";
import { loadLoanContext, buildWorkflowContext } from "./context-builder";
import { calculateRiskScore } from "./risk-scorer";
import { generateAIRecommendation } from "./ai-generator";
import { validateAgainstRules } from "./rules-validator";
import { logRecoveryWorkflow } from "./audit-logger";
import type { RecoveryEngineWorkflowResult, FinalAction } from "@/types/recovery-engine";
import { recoveryActionLabels } from "@/lib/labels";

export interface RunRecoveryEngineOptions {
  lenderId: string;
  loanId: string;
  requestMeta?: { ipAddress?: string; userAgent?: string };
}

export async function runRecoveryEngine(
  options: RunRecoveryEngineOptions
): Promise<RecoveryEngineWorkflowResult> {
  const { lenderId, loanId, requestMeta } = options;

  const repo = getDataRepository();

  let context;
  if (isAuroraActive()) {
    // Aurora path: load loan+payments from the real database.
    const loan = await repo.getLoanById(lenderId, loanId);
    if (!loan) {
      throw new Error(`Loan not found: ${loanId}`);
    }
    context = buildWorkflowContext(loan, loan.payments ?? []);
  } else {
    // Mock path: use the in-memory loader.
    context = loadLoanContext(lenderId, loanId);
    if (!context) {
      throw new Error(`Loan not found: ${loanId}`);
    }
  }

  const lender = await repo.getLender(lenderId);
  if (!lender) {
    throw new Error(`Lender not found: ${lenderId}`);
  }

  const rules = await repo.getRules(lenderId);
  const borrower = isAuroraActive()
    ? await repo.getBorrowerById(lenderId, context.loan.borrowerId)
    : (await repo.getBorrowers(lenderId)).data.find(
        (b) => b.id === context.loan.borrowerId
      );

  const riskAssessment = calculateRiskScore(context);
  const aiRecommendation = generateAIRecommendation(context, riskAssessment);
  const ruleValidation = validateAgainstRules(
    aiRecommendation.recommendedAction,
    context,
    rules,
    lender,
    borrower?.riskScore ?? riskAssessment.score
  );

  const matchedAutoRule = ruleValidation.matchedRules.find((r) => r.autoExecute);

  const finalAction: FinalAction = {
    action: ruleValidation.finalRecoveryAction,
    aiAction: ruleValidation.adjustedAction,
    label: recoveryActionLabels[ruleValidation.finalRecoveryAction],
    autoExecute:
      !ruleValidation.requiresManualApproval &&
      (matchedAutoRule?.autoExecute ?? false),
    description: aiRecommendation.nextStep,
  };

  const workflowId = `wf_${Date.now()}_${loanId}`;

  const result: RecoveryEngineWorkflowResult = {
    workflowId,
    loanId,
    lenderId,
    borrowerId: context.loan.borrowerId,
    loanNumber: context.loan.loanNumber,
    timestamp: new Date().toISOString(),
    input: context,
    riskAssessment,
    aiRecommendation,
    ruleValidation,
    finalAction,
    auditLogId: "",
  };

  result.auditLogId = logRecoveryWorkflow(result, requestMeta);

  return result;
}

export { loadLoanContext } from "./context-builder";
export { calculateRiskScore } from "./risk-scorer";
export { generateAIRecommendation } from "./ai-generator";
export { validateAgainstRules } from "./rules-validator";
