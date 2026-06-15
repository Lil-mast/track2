import type {
  AIRecommendationOutput,
  AIRecommendedAction,
  RiskAssessment,
  WorkflowInputContext,
} from "@/types/recovery-engine";

function selectAction(score: number, context: WorkflowInputContext): AIRecommendedAction {
  if (score >= 70 || context.loan.status === "default") return "escalate";
  if (score >= 40 || context.missedPaymentsCount >= 2) return "renegotiate";
  return "remind";
}

function buildReasoning(
  action: AIRecommendedAction,
  risk: RiskAssessment,
  context: WorkflowInputContext
): string {
  const borrower = context.loan.borrower;
  const name = borrower.company ?? `${borrower.firstName} ${borrower.lastName}`;
  const topFactors = risk.factors
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((f) => f.factor.toLowerCase())
    .join(" and ");

  switch (action) {
    case "remind":
      return `Account for ${name} shows early-stage delinquency with a composite risk score of ${risk.score}/100. Primary drivers are ${topFactors}. Historical payment behavior suggests this may be a timing issue rather than capacity — a low-friction reminder is the optimal first intervention.`;
    case "renegotiate":
      return `${name} has a moderate-to-high risk profile (score: ${risk.score}/100) driven by ${topFactors}. With ${context.missedPaymentsCount} missed payment(s) and ${context.daysOverdue} days overdue, a structured renegotiation (payment plan or hardship review) offers the best recovery probability before escalation costs increase.`;
    case "escalate":
      return `${name} presents significant recovery risk (score: ${risk.score}/100). ${context.daysOverdue} days overdue with ${context.missedPaymentsCount} missed payments and limited contact responsiveness warrant escalation. Collateral and legal remedies should be evaluated.`;
  }
}

function buildNextStep(
  action: AIRecommendedAction,
  context: WorkflowInputContext
): string {
  switch (action) {
    case "remind":
      if (context.daysOverdue >= 15) {
        return "Send SMS payment reminder, followed by email if no response within 48 hours.";
      }
      return "Send automated email payment reminder with direct payment link and due amount.";
    case "renegotiate":
      if (context.totalOutstanding >= 300000) {
        return "Schedule call with borrower CFO to propose modified payment terms; prepare hardship review documentation.";
      }
      return "Offer 3–6 month payment plan with reduced installments; require signed amendment within 10 business days.";
    case "escalate":
      if (context.daysOverdue >= 90) {
        return "Issue formal legal demand letter; initiate collections referral review if no response within 15 business days.";
      }
      return "Assign senior collector for priority outbound call; prepare legal notice draft for management approval.";
  }
}

export function generateAIRecommendation(
  context: WorkflowInputContext,
  riskAssessment: RiskAssessment
): AIRecommendationOutput {
  const recommendedAction = selectAction(riskAssessment.score, context);

  return {
    recommendedAction,
    riskScore: riskAssessment.score,
    reasoning: buildReasoning(recommendedAction, riskAssessment, context),
    nextStep: buildNextStep(recommendedAction, context),
  };
}
