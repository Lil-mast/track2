import type { RecoveryAction } from "@/types/index";
import type { Lender } from "@/types/lender";
import type { LenderRule } from "@/types/rules";
import type {
  AIRecommendedAction,
  MatchedRule,
  RuleValidationResult,
  WorkflowInputContext,
} from "@/types/recovery-engine";

const AI_ACTION_ORDER: AIRecommendedAction[] = ["remind", "renegotiate", "escalate"];

const AI_TO_RECOVERY: Record<AIRecommendedAction, RecoveryAction> = {
  remind: "email_reminder",
  renegotiate: "payment_plan",
  escalate: "legal_notice",
};

const ACTION_ESCALATION: Record<RecoveryAction, number> = {
  email_reminder: 1,
  sms_reminder: 2,
  phone_call: 3,
  payment_plan: 4,
  hardship_review: 5,
  legal_notice: 6,
  collections_referral: 7,
};

function evaluateRule(
  rule: LenderRule,
  context: WorkflowInputContext,
  borrowerRiskScore: number
): { matches: boolean; actualValue: number } {
  let actualValue = 0;

  switch (rule.trigger) {
    case "days_overdue":
      actualValue = context.daysOverdue;
      break;
    case "missed_payments":
      actualValue = context.missedPaymentsCount;
      break;
    case "risk_score":
      actualValue = borrowerRiskScore;
      break;
    case "balance_threshold":
      actualValue = context.totalOutstanding;
      break;
  }

  let matches = false;
  switch (rule.operator) {
    case "gte":
      matches = actualValue >= rule.threshold;
      break;
    case "lte":
      matches = actualValue <= rule.threshold;
      break;
    case "gt":
      matches = actualValue > rule.threshold;
      break;
    case "lt":
      matches = actualValue < rule.threshold;
      break;
    case "eq":
      matches = actualValue === rule.threshold;
      break;
  }

  return { matches, actualValue };
}

function mapRuleActionToAI(action: RecoveryAction): AIRecommendedAction {
  if (["email_reminder", "sms_reminder", "phone_call"].includes(action)) {
    return "remind";
  }
  if (["payment_plan", "hardship_review"].includes(action)) {
    return "renegotiate";
  }
  return "escalate";
}

function refineRecoveryAction(
  aiAction: AIRecommendedAction,
  context: WorkflowInputContext
): RecoveryAction {
  if (aiAction === "remind") {
    if (context.daysOverdue >= 30) return "phone_call";
    if (context.daysOverdue >= 15) return "sms_reminder";
    return "email_reminder";
  }
  if (aiAction === "renegotiate") {
    return context.daysOverdue >= 60 ? "hardship_review" : "payment_plan";
  }
  if (context.daysOverdue >= 120) return "collections_referral";
  if (context.daysOverdue >= 90) return "legal_notice";
  return "phone_call";
}

function maxAIAction(a: AIRecommendedAction, b: AIRecommendedAction): AIRecommendedAction {
  return AI_ACTION_ORDER.indexOf(a) >= AI_ACTION_ORDER.indexOf(b) ? a : b;
}

export function validateAgainstRules(
  aiAction: AIRecommendedAction,
  context: WorkflowInputContext,
  rules: LenderRule[],
  lender: Lender,
  borrowerRiskScore: number
): RuleValidationResult {
  const validationNotes: string[] = [];
  const matchedRules: MatchedRule[] = [];

  const activeRules = rules.filter((r) => r.isActive);

  for (const rule of activeRules) {
    const { matches, actualValue } = evaluateRule(rule, context, borrowerRiskScore);
    if (matches) {
      matchedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger: rule.trigger,
        threshold: rule.threshold,
        actualValue,
        suggestedAction: rule.action,
        autoExecute: rule.autoExecute,
        priority: rule.priority,
      });
    }
  }

  matchedRules.sort((a, b) => a.priority - b.priority);

  let adjustedAction = aiAction;
  let finalRecoveryAction = refineRecoveryAction(aiAction, context);

  if (matchedRules.length > 0) {
    validationNotes.push(
      `${matchedRules.length} lender rule(s) matched for this account.`
    );

    const highestPriorityRule = matchedRules[0];
    const ruleAIAction = mapRuleActionToAI(highestPriorityRule.suggestedAction);
    adjustedAction = maxAIAction(adjustedAction, ruleAIAction);

    const ruleEscalation = ACTION_ESCALATION[highestPriorityRule.suggestedAction];
    const currentEscalation = ACTION_ESCALATION[finalRecoveryAction];

    if (ruleEscalation > currentEscalation) {
      finalRecoveryAction = highestPriorityRule.suggestedAction;
      validationNotes.push(
        `Rule "${highestPriorityRule.ruleName}" escalated action to ${highestPriorityRule.suggestedAction.replace(/_/g, " ")}.`
      );
    } else {
      validationNotes.push(
        `Rule "${highestPriorityRule.ruleName}" matched but AI action is sufficient.`
      );
    }
  } else {
    validationNotes.push("No lender rules triggered — AI recommendation stands.");
  }

  const recentContactAttempts = context.contactHistory.filter((c) => {
    const daysSince =
      (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  if (recentContactAttempts >= lender.settings.maxContactAttemptsPerWeek) {
    validationNotes.push(
      `Contact limit reached (${recentContactAttempts}/${lender.settings.maxContactAttemptsPerWeek} this week) — manual approval required before outreach.`
    );
  }

  if (!lender.settings.aiRecommendationsEnabled) {
    validationNotes.push(
      "AI recommendations disabled for this lender — all actions require manual approval."
    );
  }

  const requiresManualApproval =
    !lender.settings.aiRecommendationsEnabled ||
    recentContactAttempts >= lender.settings.maxContactAttemptsPerWeek ||
    adjustedAction === "escalate" ||
    matchedRules.some((r) => !r.autoExecute && r.priority <= 30);

  if (adjustedAction !== aiAction) {
    validationNotes.push(
      `Action adjusted from "${aiAction}" to "${adjustedAction}" after rule validation.`
    );
    finalRecoveryAction = refineRecoveryAction(adjustedAction, context);
  }

  return {
    passed: matchedRules.length === 0 || matchedRules.every((r) => r.autoExecute || r.priority > 30),
    matchedRules,
    adjustedAction,
    finalRecoveryAction,
    validationNotes,
    requiresManualApproval,
  };
}

export { AI_TO_RECOVERY, refineRecoveryAction };
