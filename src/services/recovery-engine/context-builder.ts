import type { ContactRecord, WorkflowInputContext } from "@/types/recovery-engine";
import type { LoanWithBorrower, LoanWithDetails } from "@/types/loan";
import type { Payment } from "@/types/payment";
import type { AuditLog } from "@/types/audit";
import type { RecoveryRecommendationWithContext } from "@/types/recovery";

function buildContactHistoryFromData(
  loanId: string,
  borrowerId: string,
  auditLogs: AuditLog[],
  recommendations: RecoveryRecommendationWithContext[],
  lastContactDate?: string
): ContactRecord[] {
  const history: ContactRecord[] = [];

  const relatedAudits = auditLogs
    .filter(
      (a) =>
        (a.entityId === loanId ||
          a.entityId === borrowerId ||
          a.entityType === "recommendation") &&
        ["execute", "view", "approve"].includes(a.action)
    )
    .slice(0, 5);

  for (const audit of relatedAudits) {
    history.push({
      date: audit.createdAt,
      type: audit.action === "execute" ? "phone" : "email",
      outcome:
        audit.action === "execute"
          ? "partial_commitment"
          : audit.action === "approve"
            ? "commitment"
            : "no_response",
      notes: audit.description,
    });
  }

  if (lastContactDate) {
    history.push({
      date: lastContactDate,
      type: "phone",
      outcome: "no_response",
      notes: "Last recorded outreach attempt",
    });
  }

  const loanRecs = recommendations.filter((r) => r.loanId === loanId);
  for (const rec of loanRecs.filter((r) => r.executedAt).slice(0, 3)) {
    history.push({
      date: rec.executedAt!,
      type: rec.action.includes("email")
        ? "email"
        : rec.action.includes("sms")
          ? "sms"
          : "phone",
      outcome: rec.status === "executed" ? "completed" : "no_response",
      notes: rec.title,
    });
  }

  return history.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function computeOnTimeRate(payments: Payment[]): number {
  const resolved = payments.filter((p) =>
    ["paid", "missed", "partial"].includes(p.status)
  );
  if (resolved.length === 0) return 1;
  const onTime = resolved.filter((p) => p.status === "paid").length;
  return onTime / resolved.length;
}

export function buildWorkflowContext(
  loan: LoanWithBorrower | LoanWithDetails,
  payments: Payment[],
  options?: {
    auditLogs?: AuditLog[];
    recommendations?: RecoveryRecommendationWithContext[];
    lastContactDate?: string;
  }
): WorkflowInputContext {
  const auditLogs = options?.auditLogs ?? [];
  const recommendations = options?.recommendations ?? [];

  return {
    loan,
    payments,
    contactHistory: buildContactHistoryFromData(
      loan.id,
      loan.borrowerId,
      auditLogs,
      recommendations,
      options?.lastContactDate
    ),
    daysOverdue: loan.daysOverdue,
    missedPaymentsCount: loan.missedPaymentsCount,
    totalOutstanding: loan.outstandingBalance,
    onTimePaymentRate: computeOnTimeRate(payments),
  };
}
