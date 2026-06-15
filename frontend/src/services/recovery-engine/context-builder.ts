import {
  mockAuditLogs,
  mockBorrowers,
  mockLoans,
  mockPayments,
  mockRecommendations,
} from "@/data/mock";
import type { ContactRecord, WorkflowInputContext } from "@/types/recovery-engine";
import type { LoanWithBorrower } from "@/types/loan";
import type { Payment } from "@/types/payment";

function buildContactHistory(
  loanId: string,
  borrowerId: string,
  lastContactDate?: string
): ContactRecord[] {
  const history: ContactRecord[] = [];

  const relatedAudits = mockAuditLogs
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

  const loanRecs = mockRecommendations.filter((r) => r.loanId === loanId);
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
  loan: LoanWithBorrower,
  payments: Payment[]
): WorkflowInputContext {
  const borrower = mockBorrowers.find((b) => b.id === loan.borrowerId);

  return {
    loan,
    payments,
    contactHistory: buildContactHistory(
      loan.id,
      loan.borrowerId,
      borrower?.lastContactDate
    ),
    daysOverdue: loan.daysOverdue,
    missedPaymentsCount: loan.missedPaymentsCount,
    totalOutstanding: loan.outstandingBalance,
    onTimePaymentRate: computeOnTimeRate(payments),
  };
}

export function loadLoanContext(
  lenderId: string,
  loanId: string
): WorkflowInputContext | null {
  const loan = mockLoans.find(
    (l) => l.id === loanId && l.lenderId === lenderId
  );
  if (!loan) return null;

  const borrower = mockBorrowers.find((b) => b.id === loan.borrowerId)!;
  const loanWithBorrower: LoanWithBorrower = {
    ...loan,
    borrower: {
      id: borrower.id,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      email: borrower.email,
      phone: borrower.phone,
      company: borrower.company,
      riskLevel: borrower.riskLevel,
    },
  };

  const payments = mockPayments.filter((p) => p.loanId === loanId);
  return buildWorkflowContext(loanWithBorrower, payments);
}
