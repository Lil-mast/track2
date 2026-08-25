import type { Doc } from "../_generated/dataModel";

export interface LoanComputedFields {
  outstandingBalance: number;
  daysOverdue: number;
  monthlyPayment: number;
  missedPaymentsCount: number;
  lastPaymentAt?: number;
  lastPaymentAmount?: number;
  nextDueDate: number;
  maturityDate: number;
}

export function computeLoanFields(
  loan: Doc<"loans">,
  schedule: Doc<"repaymentSchedule">[],
  payments: Doc<"payments">[]
): LoanComputedFields {
  const now = Date.now();
  const unpaid = schedule.filter((row) => row.paidAt === undefined);

  const outstandingBalance =
    unpaid.length > 0
      ? unpaid.reduce((sum, row) => sum + row.amountDue, 0)
      : loan.principal;

  const overdueRows = unpaid.filter((row) => row.dueDate < now);
  let daysOverdue = 0;
  if (overdueRows.length > 0) {
    const earliest = Math.min(...overdueRows.map((row) => row.dueDate));
    daysOverdue = Math.max(0, Math.floor((now - earliest) / 86_400_000));
  }

  const monthlyPayment =
    schedule.length > 0
      ? schedule.reduce((sum, row) => sum + row.amountDue, 0) /
        schedule.length
      : loan.durationMonths > 0
        ? loan.principal / loan.durationMonths
        : loan.principal;

  const missedPaymentsCount = schedule.filter(
    (row) => row.status === "missed"
  ).length;

  const sortedPayments = [...payments].sort(
    (a, b) => b.paymentDate - a.paymentDate
  );
  const lastPayment = sortedPayments[0];

  const futureUnpaid = unpaid
    .filter((row) => row.dueDate >= now)
    .sort((a, b) => a.dueDate - b.dueDate);
  const nextDueDate =
    futureUnpaid[0]?.dueDate ??
    loan.startDate + loan.durationMonths * 30 * 86_400_000;

  const maturityDate =
    loan.startDate + loan.durationMonths * 30 * 86_400_000;

  return {
    outstandingBalance,
    daysOverdue,
    monthlyPayment,
    missedPaymentsCount,
    lastPaymentAt: lastPayment?.paymentDate,
    lastPaymentAmount: lastPayment?.amount,
    nextDueDate,
    maturityDate,
  };
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function mapStrategyStatus(
  status: string
):
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "expired" {
  if (status === "draft") return "pending";
  if (status === "dispatched") return "executed";
  if (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "executed" ||
    status === "expired"
  ) {
    return status;
  }
  return "pending";
}
