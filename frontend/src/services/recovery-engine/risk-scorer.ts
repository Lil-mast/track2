import type { RiskLevel } from "@/types/index";
import type { RiskAssessment, RiskFactor, WorkflowInputContext } from "@/types/recovery-engine";

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateRiskScore(context: WorkflowInputContext): RiskAssessment {
  const factors: RiskFactor[] = [];

  const overdueScore = clamp((context.daysOverdue / 120) * 40);
  factors.push({
    factor: "Days Overdue",
    weight: 0.35,
    score: overdueScore,
    description: `${context.daysOverdue} days past due (max weight at 120+ DPD)`,
  });

  const missedRatio =
    context.payments.length > 0
      ? context.missedPaymentsCount / context.payments.length
      : context.missedPaymentsCount > 0
        ? 1
        : 0;
  const missedScore = clamp(missedRatio * 25);
  factors.push({
    factor: "Missed Payments",
    weight: 0.25,
    score: missedScore,
    description: `${context.missedPaymentsCount} missed of ${context.payments.length} scheduled payments`,
  });

  const balanceRatio =
    context.loan.outstandingBalance / context.loan.principalAmount;
  const balanceScore = clamp(balanceRatio * 15);
  factors.push({
    factor: "Outstanding Balance",
    weight: 0.15,
    score: balanceScore,
    description: `${Math.round(balanceRatio * 100)}% of principal still outstanding (${context.totalOutstanding.toLocaleString()})`,
  });

  const paymentScore = clamp((1 - context.onTimePaymentRate) * 20);
  factors.push({
    factor: "Payment History",
    weight: 0.15,
    score: paymentScore,
    description: `${Math.round(context.onTimePaymentRate * 100)}% on-time payment rate`,
  });

  const recentContacts = context.contactHistory.filter((c) => {
    const daysSince =
      (Date.now() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });
  const responsiveContacts = recentContacts.filter(
    (c) => c.outcome === "commitment" || c.outcome === "partial_commitment"
  ).length;
  const contactScore =
    recentContacts.length === 0
      ? 8
      : clamp(10 - (responsiveContacts / recentContacts.length) * 10);
  factors.push({
    factor: "Contact Responsiveness",
    weight: 0.1,
    score: contactScore,
    description:
      recentContacts.length === 0
        ? "No recent contact attempts on record"
        : `${responsiveContacts}/${recentContacts.length} responsive contacts in last 30 days`,
  });

  const totalScore = clamp(
    Math.round(factors.reduce((sum, f) => sum + f.score, 0))
  );

  return {
    score: totalScore,
    level: scoreToLevel(totalScore),
    factors,
  };
}
