import { query } from "@/lib/aurora/db";
import type { IDataRepository } from "@/services/interfaces/IDataRepository";
import type { AuditLog } from "@/types/audit";
import type { Borrower, BorrowerWithLoans } from "@/types/borrower";
import type {
  DashboardStats,
  ListFilters,
  PaginatedResult,
  RiskLevel,
} from "@/types/index";
import type { Lender } from "@/types/lender";
import type {
  LoanWithBorrower,
  LoanWithDetails,
} from "@/types/loan";
import type { Payment } from "@/types/payment";
import type {
  RecoveryRecommendationWithContext,
} from "@/types/recovery";
import type { LenderRule } from "@/types/rules";

const LOAN_COMPUTED = `
  COALESCE((
    SELECT SUM(rs.amount_due)::float
    FROM repayment_schedule rs
    WHERE rs.loan_id = l.id AND rs.paid_at IS NULL
  ), l.principal::float) AS outstanding_balance,
  COALESCE((
    SELECT GREATEST(0, EXTRACT(DAY FROM (NOW() - MIN(rs.due_date))))::int
    FROM repayment_schedule rs
    WHERE rs.loan_id = l.id AND rs.paid_at IS NULL AND rs.due_date < NOW()
  ), 0) AS days_overdue,
  COALESCE((
    SELECT AVG(rs.amount_due)::float FROM repayment_schedule rs WHERE rs.loan_id = l.id
  ), (l.principal / NULLIF(l.duration_months, 0))::float) AS monthly_payment,
  COALESCE((
    SELECT COUNT(*)::int FROM repayment_schedule rs
    WHERE rs.loan_id = l.id AND rs.status = 'missed'
  ), 0) AS missed_payments_count,
  (
    SELECT MAX(p.payment_date) FROM payments p WHERE p.loan_id = l.id
  ) AS last_payment_at,
  (
    SELECT p.amount::float FROM payments p
    WHERE p.loan_id = l.id
    ORDER BY p.payment_date DESC LIMIT 1
  ) AS last_payment_amount,
  COALESCE((
    SELECT MIN(rs.due_date) FROM repayment_schedule rs
    WHERE rs.loan_id = l.id AND rs.paid_at IS NULL AND rs.due_date >= NOW()
  ), l.start_date + (l.duration_months || ' months')::interval) AS next_due_date,
  (l.start_date + (l.duration_months || ' months')::interval) AS maturity_date
`;

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.slice(1).join(" ") || "",
  };
}

function asString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asRiskLevel(value: unknown): RiskLevel {
  const level = asString(value, "low");
  if (
    level === "low" ||
    level === "medium" ||
    level === "high" ||
    level === "critical"
  ) {
    return level;
  }
  return "low";
}

function mapStrategyStatus(status: string): RecoveryRecommendationWithContext["status"] {
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

function mapBorrowerRow(row: Record<string, unknown>): Borrower {
  const { firstName, lastName } = splitName(asString(row.name));
  return {
    id: asString(row.id),
    lenderId: asString(row.lender_id),
    firstName,
    lastName,
    email: asString(row.email),
    phone: asString(row.phone),
    company: row.company ? asString(row.company) : undefined,
    address: {
      street: asString(row.address_street),
      city: asString(row.address_city),
      state: asString(row.address_state),
      zip: asString(row.address_zip),
    },
    riskScore: asNumber(row.risk_score),
    riskLevel: asRiskLevel(row.risk_level),
    totalOutstanding: asNumber(row.total_outstanding),
    activeLoans: asNumber(row.active_loans),
    missedPaymentsCount: asNumber(row.missed_payments_count),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

function mapLoanRow(
  row: Record<string, unknown>,
  borrower?: Record<string, unknown>
): LoanWithBorrower {
  const bRow = borrower ?? row;
  const { firstName, lastName } = splitName(asString(bRow.name ?? bRow.borrower_name));

  return {
    id: asString(row.id),
    lenderId: asString(row.lender_id),
    borrowerId: asString(row.borrower_id),
    loanNumber: asString(row.loan_number),
    principalAmount: asNumber(row.principal),
    outstandingBalance: asNumber(row.outstanding_balance),
    interestRate: asNumber(row.interest_rate),
    termMonths: asNumber(row.duration_months),
    monthlyPayment: asNumber(row.monthly_payment),
    status: asString(row.status) as LoanWithBorrower["status"],
    riskLevel: asRiskLevel(row.risk_level),
    originationDate: asString(row.disbursement_date ?? row.start_date),
    maturityDate: asString(row.maturity_date),
    nextPaymentDueDate: asString(row.next_due_date),
    daysOverdue: asNumber(row.days_overdue),
    missedPaymentsCount: asNumber(row.missed_payments_count),
    lastPaymentDate: row.last_payment_at
      ? asString(row.last_payment_at)
      : undefined,
    lastPaymentAmount: row.last_payment_amount
      ? asNumber(row.last_payment_amount)
      : undefined,
    collateral: row.collateral ? asString(row.collateral) : undefined,
    purpose: asString(row.purpose),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    borrower: {
      id: asString(bRow.id ?? row.borrower_id),
      firstName,
      lastName,
      email: asString(bRow.email ?? bRow.borrower_email),
      phone: asString(bRow.phone),
      company: bRow.company ? asString(bRow.company) : undefined,
      riskLevel: asRiskLevel(bRow.risk_level ?? row.risk_level),
    },
  };
}

function mapRecommendationRow(
  row: Record<string, unknown>,
  loan?: Record<string, unknown>,
  borrower?: Record<string, unknown>
): RecoveryRecommendationWithContext {
  const lRow = loan ?? row;
  const bRow = borrower ?? row;
  const { firstName, lastName } = splitName(asString(bRow.name ?? bRow.borrower_name));
  const status = mapStrategyStatus(asString(row.status, "pending"));
  const action = asString(
    row.recovery_action ?? row.action ?? "email_reminder"
  ) as RecoveryRecommendationWithContext["action"];

  return {
    id: asString(row.id),
    lenderId: asString(row.lender_id),
    loanId: asString(row.loan_id),
    borrowerId: asString(bRow.id ?? row.borrower_id),
    action,
    status,
    priority: asNumber(row.priority, 50),
    confidenceScore: asNumber(row.confidence_score, 0.5),
    riskLevel: asRiskLevel(row.risk_level ?? bRow.risk_level ?? lRow.risk_level),
    title:
      asString(row.recommended_action) ||
      asString(row.summary, "Recovery Strategy").slice(0, 80),
    summary: asString(row.summary, asString(row.content, "").slice(0, 200)),
    reasoning: asString(row.summary, asString(row.content, "").slice(0, 500)),
    suggestedScript: row.suggested_script
      ? asString(row.suggested_script)
      : undefined,
    expectedRecoveryAmount: row.expected_recovery_amount
      ? asNumber(row.expected_recovery_amount)
      : undefined,
    expectedRecoveryRate: row.expected_recovery_rate
      ? asNumber(row.expected_recovery_rate)
      : undefined,
    aiModel: asString(row.model_id, "amazon.nova-pro-v1:0"),
    aiModelVersion: asString(row.ai_model_version, "v1:0"),
    generatedAt: asString(row.created_at),
    reviewedAt: row.reviewed_at ? asString(row.reviewed_at) : undefined,
    executedAt: row.executed_at ? asString(row.executed_at) : undefined,
    expiresAt: asString(row.expires_at, new Date(Date.now() + 30 * 86400000).toISOString()),
    loan: {
      id: asString(lRow.id ?? row.loan_id),
      loanNumber: asString(lRow.loan_number),
      outstandingBalance: asNumber(lRow.outstanding_balance),
      daysOverdue: asNumber(lRow.days_overdue),
      status: asString(lRow.status) as RecoveryRecommendationWithContext["loan"]["status"],
    },
    borrower: {
      id: asString(bRow.id ?? row.borrower_id),
      firstName,
      lastName,
      email: asString(bRow.email ?? bRow.borrower_email),
      phone: asString(bRow.phone),
      company: bRow.company ? asString(bRow.company) : undefined,
      riskLevel: asRiskLevel(bRow.risk_level),
      riskScore: asNumber(bRow.risk_score),
    },
  };
}

export class AuroraDataRepository implements IDataRepository {
  async getLender(lenderId: string): Promise<Lender | null> {
    const { rows } = await query(
      `SELECT id, name, email, organization, created_at, updated_at
       FROM users WHERE id = :lenderId AND role = 'lender'`,
      { lenderId }
    );
    const row = rows[0];
    if (!row) return null;

    return {
      id: asString(row.id),
      name: asString(row.name),
      slug: asString(row.organization, "demo").toLowerCase().replace(/\s+/g, "-"),
      industry: "Financial Services",
      contactEmail: asString(row.email),
      contactPhone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "Kenya",
      },
      settings: {
        timezone: "Africa/Nairobi",
        currency: "KES",
        businessHoursStart: "08:00",
        businessHoursEnd: "17:00",
        aiRecommendationsEnabled: true,
        autoApproveLowRiskActions: false,
        maxContactAttemptsPerWeek: 3,
      },
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    };
  }

  async getDashboardStats(lenderId: string): Promise<DashboardStats> {
    const { rows } = await query(
      `SELECT
         COUNT(*)::int AS total_loans,
         COUNT(*) FILTER (WHERE l.status IN ('active', 'overdue'))::int AS active_loans,
         COUNT(*) FILTER (WHERE l.status IN ('overdue', 'default'))::int AS overdue_loans,
         COALESCE(SUM(
           COALESCE((
             SELECT SUM(rs.amount_due)::float
             FROM repayment_schedule rs
             WHERE rs.loan_id = l.id AND rs.paid_at IS NULL
           ), l.principal::float)
         ), 0)::float AS total_outstanding
       FROM loans l
       WHERE l.lender_id = :lenderId`,
      { lenderId }
    );

    const highRisk = await query(
      `SELECT COUNT(*)::int AS count
       FROM users
       WHERE lender_id = :lenderId AND role = 'borrower'
         AND risk_level IN ('high', 'critical')`,
      { lenderId }
    );

    const stats = rows[0] ?? {};
    return {
      totalLoans: asNumber(stats.total_loans),
      activeLoans: asNumber(stats.active_loans),
      overdueLoans: asNumber(stats.overdue_loans),
      highRiskAccounts: asNumber(highRisk.rows[0]?.count),
      totalOutstanding: asNumber(stats.total_outstanding),
      recoveryRate: 0.73,
    };
  }

  async getBorrowers(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<Borrower>> {
    const { rows } = await query(
      `SELECT u.*,
         COALESCE((
           SELECT SUM(
             COALESCE((
               SELECT SUM(rs.amount_due)::float
               FROM repayment_schedule rs
               WHERE rs.loan_id = l.id AND rs.paid_at IS NULL
             ), l.principal::float)
           )
           FROM loans l WHERE l.borrower_id = u.id
         ), 0)::float AS total_outstanding,
         COALESCE((
           SELECT COUNT(*)::int FROM loans l
           WHERE l.borrower_id = u.id AND l.status IN ('active', 'overdue')
         ), 0)::int AS active_loans,
         COALESCE((
           SELECT COUNT(*)::int FROM repayment_schedule rs
           JOIN loans l ON l.id = rs.loan_id
           WHERE l.borrower_id = u.id AND rs.status = 'missed'
         ), 0)::int AS missed_payments_count
       FROM users u
       WHERE u.lender_id = :lenderId AND u.role = 'borrower'
       ORDER BY u.name ASC`,
      { lenderId }
    );

    let items = rows.map(mapBorrowerRow);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (b) =>
          b.firstName.toLowerCase().includes(q) ||
          b.lastName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.company?.toLowerCase().includes(q)
      );
    }

    if (filters.riskLevel) {
      items = items.filter((b) => b.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters.page, filters.pageSize);
  }

  async getBorrowerById(
    lenderId: string,
    borrowerId: string
  ): Promise<BorrowerWithLoans | null> {
    const { rows } = await query(
      `SELECT u.*,
         COALESCE((
           SELECT SUM(
             COALESCE((
               SELECT SUM(rs.amount_due)::float
               FROM repayment_schedule rs
               WHERE rs.loan_id = l.id AND rs.paid_at IS NULL
             ), l.principal::float)
           )
           FROM loans l WHERE l.borrower_id = u.id
         ), 0)::float AS total_outstanding,
         COALESCE((
           SELECT COUNT(*)::int FROM loans l
           WHERE l.borrower_id = u.id AND l.status IN ('active', 'overdue')
         ), 0)::int AS active_loans,
         COALESCE((
           SELECT COUNT(*)::int FROM repayment_schedule rs
           JOIN loans l ON l.id = rs.loan_id
           WHERE l.borrower_id = u.id AND rs.status = 'missed'
         ), 0)::int AS missed_payments_count
       FROM users u
       WHERE u.id = :borrowerId AND u.lender_id = :lenderId AND u.role = 'borrower'`,
      { borrowerId, lenderId }
    );

    const row = rows[0];
    if (!row) return null;

    const loansResult = await query(
      `SELECT l.id, l.loan_number, l.status, l.risk_level,
         ${LOAN_COMPUTED}
       FROM loans l
       WHERE l.borrower_id = :borrowerId AND l.lender_id = :lenderId`,
      { borrowerId, lenderId }
    );

    const loans = loansResult.rows.map((l) => ({
      id: asString(l.id),
      loanNumber: asString(l.loan_number),
      outstandingBalance: asNumber(l.outstanding_balance),
      status: asString(l.status) as BorrowerWithLoans["loans"][0]["status"],
      daysOverdue: asNumber(l.days_overdue),
      riskLevel: asRiskLevel(l.risk_level),
    }));

    return { ...mapBorrowerRow(row), loans };
  }

  async getLoans(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<LoanWithBorrower>> {
    const { rows } = await query(
      `SELECT l.*, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_level AS borrower_risk_level,
         ${LOAN_COMPUTED}
       FROM loans l
       JOIN users b ON l.borrower_id = b.id
       WHERE l.lender_id = :lenderId
       ORDER BY l.created_at DESC`,
      { lenderId }
    );

    let items = rows.map((row) =>
      mapLoanRow(row, {
        id: row.borrower_id,
        name: row.borrower_name,
        email: row.borrower_email,
        phone: row.phone,
        company: row.company,
        risk_level: row.borrower_risk_level,
      })
    );

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.loanNumber.toLowerCase().includes(q) ||
          l.borrower.firstName.toLowerCase().includes(q) ||
          l.borrower.lastName.toLowerCase().includes(q) ||
          l.borrower.company?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      items = items.filter((l) => l.status === filters.status);
    }

    if (filters.riskLevel) {
      items = items.filter((l) => l.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters.page, filters.pageSize);
  }

  async getLoanById(
    lenderId: string,
    loanId: string
  ): Promise<LoanWithDetails | null> {
    const { rows } = await query(
      `SELECT l.*, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_level AS borrower_risk_level,
         ${LOAN_COMPUTED}
       FROM loans l
       JOIN users b ON l.borrower_id = b.id
       WHERE l.id = :loanId AND l.lender_id = :lenderId`,
      { loanId, lenderId }
    );

    const row = rows[0];
    if (!row) return null;

    const enriched = mapLoanRow(row, {
      id: row.borrower_id,
      name: row.borrower_name,
      email: row.borrower_email,
      phone: row.phone,
      company: row.company,
      risk_level: row.borrower_risk_level,
    });

    const paymentsResult = await query(
      `SELECT p.*, l.lender_id
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE p.loan_id = :loanId
       ORDER BY p.payment_date DESC`,
      { loanId }
    );

    const payments: Payment[] = paymentsResult.rows.map((p) => ({
      id: asString(p.id),
      lenderId: asString(p.lender_id),
      loanId: asString(p.loan_id),
      borrowerId: asString(p.borrower_id),
      amount: asNumber(p.amount),
      scheduledDate: asString(p.payment_date),
      paidDate: asString(p.payment_date),
      status: asString(p.status) as Payment["status"],
      paymentMethod: p.payment_method ? asString(p.payment_method) : undefined,
      confirmationNumber: p.confirmation_number
        ? asString(p.confirmation_number)
        : undefined,
      notes: p.notes ? asString(p.notes) : undefined,
      createdAt: asString(p.created_at),
    }));

    const recsResult = await query(
      `SELECT id, recovery_action, status, recommended_action, summary,
         confidence_score, created_at
       FROM strategies
       WHERE loan_id = :loanId
       ORDER BY created_at DESC`,
      { loanId }
    );

    const recommendations = recsResult.rows.map((r) => ({
      id: asString(r.id),
      action: asString(r.recovery_action ?? "email_reminder") as LoanWithDetails["recommendations"][0]["action"],
      status: mapStrategyStatus(asString(r.status)),
      title: asString(r.recommended_action ?? r.summary, "Recovery Strategy"),
      confidenceScore: asNumber(r.confidence_score, 0.5),
      generatedAt: asString(r.created_at),
    }));

    return { ...enriched, payments, recommendations };
  }

  async getOverdueLoans(lenderId: string): Promise<LoanWithBorrower[]> {
    const { rows } = await query(
      `SELECT l.*, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_level AS borrower_risk_level,
         ${LOAN_COMPUTED}
       FROM loans l
       JOIN users b ON l.borrower_id = b.id
       WHERE l.lender_id = :lenderId
         AND l.status IN ('overdue', 'default')
       ORDER BY days_overdue DESC`,
      { lenderId }
    );

    return rows.map((row) =>
      mapLoanRow(row, {
        id: row.borrower_id,
        name: row.borrower_name,
        email: row.borrower_email,
        phone: row.phone,
        company: row.company,
        risk_level: row.borrower_risk_level,
      })
    );
  }

  async getMissedPayments(lenderId: string): Promise<Payment[]> {
    const { rows } = await query(
      `SELECT rs.id, rs.loan_id, rs.due_date, rs.amount_due, rs.status,
         l.lender_id, l.borrower_id, rs.created_at
       FROM repayment_schedule rs
       JOIN loans l ON l.id = rs.loan_id
       WHERE l.lender_id = :lenderId AND rs.status = 'missed'
       ORDER BY rs.due_date DESC`,
      { lenderId }
    );

    return rows.map((r) => ({
      id: asString(r.id),
      lenderId: asString(r.lender_id),
      loanId: asString(r.loan_id),
      borrowerId: asString(r.borrower_id),
      amount: asNumber(r.amount_due),
      scheduledDate: asString(r.due_date),
      status: "missed" as const,
      createdAt: asString(r.created_at),
    }));
  }

  async getRecommendations(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<RecoveryRecommendationWithContext>> {
    const { rows } = await query(
      `SELECT s.*, l.loan_number, l.status AS loan_status, l.risk_level AS loan_risk_level,
         ${LOAN_COMPUTED},
         b.id AS borrower_id, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_score, b.risk_level AS borrower_risk_level
       FROM strategies s
       JOIN loans l ON s.loan_id = l.id
       JOIN users b ON l.borrower_id = b.id
       WHERE s.lender_id = :lenderId
       ORDER BY s.created_at DESC`,
      { lenderId }
    );

    let items = rows.map((row) => mapRecommendationRow(row, row, row));

    if (filters.status) {
      items = items.filter((r) => r.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.borrower.firstName.toLowerCase().includes(q) ||
          r.borrower.lastName.toLowerCase().includes(q)
      );
    }

    return paginate(items, filters.page, filters.pageSize);
  }

  async getRecommendationById(
    lenderId: string,
    recommendationId: string
  ): Promise<RecoveryRecommendationWithContext | null> {
    const { rows } = await query(
      `SELECT s.*, l.loan_number, l.status AS loan_status, l.risk_level AS loan_risk_level,
         ${LOAN_COMPUTED},
         b.id AS borrower_id, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_score, b.risk_level AS borrower_risk_level
       FROM strategies s
       JOIN loans l ON s.loan_id = l.id
       JOIN users b ON l.borrower_id = b.id
       WHERE s.id = :recommendationId AND s.lender_id = :lenderId`,
      { recommendationId, lenderId }
    );

    const row = rows[0];
    return row ? mapRecommendationRow(row, row, row) : null;
  }

  async getRecentRecommendations(
    lenderId: string,
    limit = 5
  ): Promise<RecoveryRecommendationWithContext[]> {
    const { rows } = await query(
      `SELECT s.*, l.loan_number, l.status AS loan_status, l.risk_level AS loan_risk_level,
         ${LOAN_COMPUTED},
         b.id AS borrower_id, b.name AS borrower_name, b.email AS borrower_email,
         b.phone, b.company, b.risk_score, b.risk_level AS borrower_risk_level
       FROM strategies s
       JOIN loans l ON s.loan_id = l.id
       JOIN users b ON l.borrower_id = b.id
       WHERE s.lender_id = :lenderId
       ORDER BY s.created_at DESC
       LIMIT :limit`,
      { lenderId, limit }
    );

    return rows.map((row) => mapRecommendationRow(row, row, row));
  }

  async getRules(lenderId: string): Promise<LenderRule[]> {
    const { rows } = await query(
      `SELECT * FROM lender_rules
       WHERE lender_id = :lenderId
       ORDER BY priority ASC`,
      { lenderId }
    );

    return rows.map((r) => ({
      id: asString(r.id),
      lenderId: asString(r.lender_id),
      name: asString(r.name),
      description: asString(r.description),
      trigger: asString(r.trigger) as LenderRule["trigger"],
      operator: asString(r.operator) as LenderRule["operator"],
      threshold: asNumber(r.threshold),
      action: asString(r.action) as LenderRule["action"],
      priority: asNumber(r.priority, 50),
      isActive: Boolean(r.is_active),
      autoExecute: Boolean(r.auto_execute),
      cooldownDays: asNumber(r.cooldown_days, 7),
      createdAt: asString(r.created_at),
      updatedAt: asString(r.updated_at),
    }));
  }

  async getAuditLogs(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<AuditLog>> {
    const { rows } = await query(
      `SELECT * FROM audit_logs
       WHERE lender_id = :lenderId
       ORDER BY created_at DESC`,
      { lenderId }
    );

    let items: AuditLog[] = rows.map((r) => ({
      id: asString(r.id),
      lenderId: asString(r.lender_id),
      userId: asString(r.user_id),
      userName: asString(r.user_name),
      userEmail: asString(r.user_email),
      action: asString(r.action) as AuditLog["action"],
      entityType: asString(r.entity_type) as AuditLog["entityType"],
      entityId: asString(r.entity_id),
      entityLabel: asString(r.entity_label),
      description: asString(r.description),
      ipAddress: asString(r.ip_address),
      userAgent: asString(r.user_agent),
      metadata: r.metadata as Record<string, unknown> | undefined,
      createdAt: asString(r.created_at),
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q) ||
          a.entityLabel.toLowerCase().includes(q)
      );
    }

    return paginate(items, filters.page, filters.pageSize);
  }
}

export const auroraDataRepository = new AuroraDataRepository();
