/// data access via Aurora RDS Data API

import {
  RDSDataClient,
  ExecuteStatementCommand,
  type ColumnMetadata,
  type Field,
  type SqlParameter,
} from "@aws-sdk/client-rds-data";
import type { IDataRepository } from "@/services/interfaces/IDataRepository";
import type { AuditLog } from "@/types/audit";
import type { Borrower, BorrowerWithLoans } from "@/types/borrower";
import type {
  DashboardStats,
  ListFilters,
  PaginatedResult,
} from "@/types/index";
import type { Lender } from "@/types/lender";
import type { LoanWithBorrower, LoanWithDetails } from "@/types/loan";
import type { Payment } from "@/types/payment";
import type { RecoveryRecommendationWithContext } from "@/types/recovery";
import type { LenderRule } from "@/types/rules";


// RDS Data API Client

type RDSClientConfig = ConstructorParameters<typeof RDSDataClient>[0];

const clientConfig: RDSClientConfig = {
  region: process.env.AWS_REGION || "eu-west-2",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN
      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
      : {}),
  };
}

const rdsClient = new RDSDataClient(clientConfig);

const resourceArn = process.env.AURORA_CLUSTER_ARN;
const secretArn = process.env.AURORA_SECRET_ARN;
const database = process.env.AURORA_DATABASE || "recoveryai";

// Param helpers (ported verbatim from backend/src/services/db.js)


type ParamValue = string | number | boolean | null | undefined | object;

const buildNamedParam = (name: string, val: ParamValue): SqlParameter => {
  if (val === null || val === undefined) {
    return { name, value: { isNull: true } };
  }
  if (typeof val === "string") {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val
      );
    return {
      name,
      value: { stringValue: val },
      ...(isUuid ? { typeHint: "UUID" } : {}),
    };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { name, value: { longValue: val } };
    return { name, value: { doubleValue: val } };
  }
  if (typeof val === "boolean") {
    return { name, value: { booleanValue: val } };
  }
  return { name, value: { stringValue: JSON.stringify(val) } };
};

const formatParameters = (
  params: Record<string, ParamValue> | ParamValue[]
): SqlParameter[] => {
  if (!params) return [];
  if (Array.isArray(params)) {
    return params.map((val, i) => buildNamedParam(`p${i}`, val));
  }
  return Object.entries(params).map(([name, val]) => buildNamedParam(name, val));
};

const formatRecords = (
  records: Field[][] | undefined,
  columnMetadata: ColumnMetadata[] | undefined
): Record<string, unknown>[] => {
  if (!records || !columnMetadata) return [];
  return records.map((record) => {
    const obj: Record<string, unknown> = {};
    record.forEach((value, index) => {
      const colName = columnMetadata[index].name!;
      // Cast through unknown — Field is a discriminated union ($UnknownMember),
      // not directly indexable. We extract the first non-undefined entry.
      const asObj = value as unknown as Record<string, unknown>;
      const fieldEntries = Object.entries(asObj);
      const found = fieldEntries.find(([, v]) => v !== undefined && v !== null);
      obj[colName] = found
        ? found[0] === "isNull"
          ? null
          : found[1]
        : null;
    });
    return obj;
  });
};


// Core query function — exported for use by AI route handlers
// (risk-score, generate-strategy, get-strategies routes need
// raw SQL access to ai_insights, strategies, repayment_schedule)

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

/**
 * Executes a SQL statement against Aurora via the RDS Data API.
 *
 * @param sql    — SQL string. Use :paramName placeholders for named params,
 *                 or $1/$2/... for legacy positional (auto-rewritten to :p0/:p1/...).
 * @param params — Named object { loanId: "uuid" } or positional array ["uuid"].
 */
export const query = async (
  sql: string,
  params: Record<string, ParamValue> | ParamValue[] = []
): Promise<QueryResult> => {
  if (!resourceArn || !secretArn) {
    throw new Error(
      "Database not configured: AURORA_CLUSTER_ARN and AURORA_SECRET_ARN must be set."
    );
  }

  // Rewrite $1/$2 positional syntax to :p0/:p1 for RDS Data API
  let processedSql = sql;
  if (Array.isArray(params)) {
    processedSql = sql.replace(
      /\$(\d+)/g,
      (_, num) => `:p${parseInt(num, 10) - 1}`
    );
  }

  try {
    const command = new ExecuteStatementCommand({
      resourceArn,
      secretArn,
      database,
      sql: processedSql,
      parameters: formatParameters(params),
      includeResultMetadata: true,
    });

    const response = await rdsClient.send(command);

    return {
      rows: formatRecords(response.records, response.columnMetadata),
      rowCount: response.records?.length ?? 0,
    };
  } catch (error) {
    console.error("RDS Data API Error:", error);
    throw error;
  }
};

// Aurora returns snake_case column names; the frontend types
// (generated from MockDataRepository) are all camelCase.
// Each mapper below converts one row → one typed object.

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v as string) ?? "";
const num = (v: unknown): number => Number(v ?? 0);
const bool = (v: unknown): boolean => Boolean(v);
const strOrUndef = (v: unknown): string | undefined =>
  v != null ? (v as string) : undefined;
const numOrUndef = (v: unknown): number | undefined =>
  v != null ? Number(v) : undefined;

const mapBorrower = (row: Row): Borrower => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  // users.name is a single field — split on first space
  firstName: str(row.name).split(" ")[0] ?? "",
  lastName: str(row.name).split(" ").slice(1).join(" ") || "",
  email: str(row.email),
  phone: str(row.phone),
  company: strOrUndef(row.company),
  address: {
    street: str(row.address_street),
    city: str(row.address_city),
    state: str(row.address_state),
    zip: str(row.address_zip),
  },
  riskScore: num(row.risk_score),
  riskLevel: (row.risk_level as Borrower["riskLevel"]) ?? "low",
  totalOutstanding: num(row.total_outstanding),
  activeLoans: num(row.active_loans),
  missedPaymentsCount: num(row.missed_payments_count),
  lastContactDate: strOrUndef(row.last_contact_date),
  notes: strOrUndef(row.notes),
  createdAt: str(row.created_at),
  updatedAt: str(row.updated_at),
});

const mapLoan = (row: Row) => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  borrowerId: str(row.borrower_id),
  loanNumber: str(row.loan_number),
  principalAmount: num(row.principal),
  outstandingBalance: num(row.outstanding_balance),
  interestRate: num(row.interest_rate),
  termMonths: num(row.duration_months),
  monthlyPayment: num(row.monthly_payment),
  status: row.status as LoanWithBorrower["status"],
  riskLevel: (row.risk_level as LoanWithBorrower["riskLevel"]) ?? "low",
  originationDate: str(row.disbursement_date),
  maturityDate: str(row.maturity_date),
  nextPaymentDueDate: str(row.next_payment_due),
  daysOverdue: num(row.days_overdue),
  missedPaymentsCount: num(row.missed_payments_count),
  lastPaymentDate: strOrUndef(row.last_payment_date),
  lastPaymentAmount: numOrUndef(row.last_payment_amount),
  collateral: strOrUndef(row.collateral),
  purpose: str(row.purpose),
  createdAt: str(row.created_at),
  updatedAt: str(row.updated_at),
});

const mapBorrowerInline = (row: Row): LoanWithBorrower["borrower"] => ({
  id: str(row.borrower_id),
  firstName: str(row.borrower_name).split(" ")[0] ?? "",
  lastName: str(row.borrower_name).split(" ").slice(1).join(" ") || "",
  email: str(row.borrower_email),
  phone: str(row.borrower_phone),
  company: strOrUndef(row.borrower_company),
  riskLevel: (row.borrower_risk_level as LoanWithBorrower["borrower"]["riskLevel"]) ?? "low",
});

const mapPayment = (row: Row): Payment => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  loanId: str(row.loan_id),
  borrowerId: str(row.borrower_id),
  amount: num(row.amount),
  scheduledDate: str(row.scheduled_date),
  paidDate: strOrUndef(row.paid_date),
  status: row.status as Payment["status"],
  paymentMethod: strOrUndef(row.payment_method),
  confirmationNumber: strOrUndef(row.confirmation_number),
  notes: strOrUndef(row.notes),
  createdAt: str(row.created_at),
});

const mapRule = (row: Row): LenderRule => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  name: str(row.name),
  description: str(row.description),
  trigger: row.trigger as LenderRule["trigger"],
  operator: row.operator as LenderRule["operator"],
  threshold: num(row.threshold),
  action: row.action as LenderRule["action"],
  priority: num(row.priority),
  isActive: bool(row.is_active),
  autoExecute: bool(row.auto_execute),
  cooldownDays: num(row.cooldown_days),
  createdAt: str(row.created_at),
  updatedAt: str(row.updated_at),
});

const mapAuditLog = (row: Row): AuditLog => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  userId: str(row.user_id),
  userName: str(row.user_name),
  userEmail: str(row.user_email),
  action: row.action as AuditLog["action"],
  entityType: row.entity_type as AuditLog["entityType"],
  entityId: str(row.entity_id),
  entityLabel: str(row.entity_label),
  description: str(row.description),
  ipAddress: str(row.ip_address),
  userAgent: str(row.user_agent),
  metadata: row.metadata
    ? (row.metadata as Record<string, unknown>)
    : undefined,
  createdAt: str(row.created_at),
});

const mapRecommendation = (row: Row): RecoveryRecommendationWithContext => ({
  id: str(row.id),
  lenderId: str(row.lender_id),
  loanId: str(row.loan_id),
  borrowerId: str(row.borrower_id),
  action: row.recovery_action as RecoveryRecommendationWithContext["action"],
  status: row.status as RecoveryRecommendationWithContext["status"],
  priority: num(row.priority),
  confidenceScore: num(row.confidence_score),
  riskLevel: (row.risk_level as RecoveryRecommendationWithContext["riskLevel"]) ?? "low",
  title: str(row.recommended_action), // strategies.recommended_action → title badge
  summary: str(row.summary),
  reasoning: str(row.reasoning),
  suggestedScript: strOrUndef(row.suggested_script),
  expectedRecoveryAmount: numOrUndef(row.expected_recovery_amount),
  expectedRecoveryRate: numOrUndef(row.expected_recovery_rate),
  aiModel: str(row.model_id),
  aiModelVersion: str(row.ai_model_version),
  generatedAt: str(row.created_at),
  reviewedAt: strOrUndef(row.reviewed_at),
  reviewedBy: strOrUndef(row.reviewed_by),
  executedAt: strOrUndef(row.executed_at),
  expiresAt: str(row.expires_at),
  metadata: row.metadata
    ? (row.metadata as Record<string, unknown>)
    : undefined,
  loan: {
    id: str(row.loan_id),
    loanNumber: str(row.loan_number),
    outstandingBalance: num(row.outstanding_balance),
    daysOverdue: num(row.days_overdue),
    status: row.loan_status as RecoveryRecommendationWithContext["loan"]["status"],
  },
  borrower: {
    id: str(row.borrower_id),
    firstName: str(row.borrower_name).split(" ")[0] ?? "",
    lastName: str(row.borrower_name).split(" ").slice(1).join(" ") || "",
    email: str(row.borrower_email),
    phone: str(row.borrower_phone),
    company: strOrUndef(row.borrower_company),
    riskLevel:
      (row.borrower_risk_level as RecoveryRecommendationWithContext["borrower"]["riskLevel"]) ??
      "low",
    riskScore: num(row.borrower_risk_score),
  },
});

// Pagination helper


function buildPaginated<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// AuroraDataRepository


export class AuroraDataRepository implements IDataRepository {
  
  // getLender
  // The users table holds lenders (role = 'lender'). The Lender
  // type needs a slug, industry, contactEmail, contactPhone,
  // address, and settings — these aren't stored in users, so we
  // derive sensible defaults from available columns.
  async getLender(lenderId: string): Promise<Lender | null> {
    const { rows } = await query(
      `SELECT id, name, email, organization, created_at, updated_at
       FROM users
       WHERE id = :lenderId AND role = 'lender'`,
      { lenderId }
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: str(r.id),
      name: str(r.name),
      slug: str(r.name).toLowerCase().replace(/\s+/g, "-"),
      industry: "Financial Services",
      contactEmail: str(r.email),
      contactPhone: "",
      address: { street: "", city: "", state: "", zip: "", country: "KE" },
      settings: {
        timezone: "Africa/Nairobi",
        currency: "KES",
        businessHoursStart: "08:00",
        businessHoursEnd: "17:00",
        aiRecommendationsEnabled: true,
        autoApproveLowRiskActions: false,
        maxContactAttemptsPerWeek: 3,
      },
      createdAt: str(r.created_at),
      updatedAt: str(r.updated_at),
    };
  }

  // getDashboardStats
  // Mirrors MockDataRepository logic:
  //   activeLoans  = 'active' OR 'overdue'
  //   overdueLoans = 'overdue' OR 'default'
  //   highRisk     = borrowers with risk_level IN ('high','critical')

  async getDashboardStats(lenderId: string): Promise<DashboardStats> {
    const { rows } = await query(
      `SELECT
         COUNT(*)                                                      AS total_loans,
         COUNT(*) FILTER (WHERE status IN ('active','overdue'))        AS active_loans,
         COUNT(*) FILTER (WHERE status IN ('overdue','default'))       AS overdue_loans,
         COALESCE(SUM(outstanding_balance), 0)                        AS total_outstanding
       FROM loans
       WHERE lender_id = :lenderId`,
      { lenderId }
    );

    const { rows: riskRows } = await query(
      `SELECT COUNT(*) AS high_risk_accounts
       FROM users
       WHERE lender_id = :lenderId
         AND role = 'borrower'
         AND risk_level IN ('high', 'critical')`,
      { lenderId }
    );

    // Recovery rate: paid-off loans / total loans
    const { rows: rateRows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'paid_off') AS paid_off,
         COUNT(*)                                     AS total
       FROM loans
       WHERE lender_id = :lenderId`,
      { lenderId }
    );

    const s = rows[0];
    const rateRow = rateRows[0];
    const paidOff = num(rateRow.paid_off);
    const total = num(rateRow.total);
    const recoveryRate = total > 0 ? paidOff / total : 0;

    return {
      totalLoans: num(s.total_loans),
      activeLoans: num(s.active_loans),
      overdueLoans: num(s.overdue_loans),
      highRiskAccounts: num(riskRows[0].high_risk_accounts),
      totalOutstanding: num(s.total_outstanding),
      recoveryRate,
    };
  }

  // getBorrowers — paginated, with search + riskLevel filter
  // Aggregate columns (totalOutstanding, activeLoans,
  // missedPaymentsCount) are computed inline via subqueries.

  async getBorrowers(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<Borrower>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const params: Record<string, ParamValue> = { lenderId, pageSize, offset };

    let whereClause = `WHERE u.lender_id = :lenderId AND u.role = 'borrower'`;

    if (filters.riskLevel) {
      whereClause += ` AND u.risk_level = :riskLevel`;
      params.riskLevel = filters.riskLevel;
    }

    if (filters.search) {
      whereClause += ` AND (u.name ILIKE :search OR u.email ILIKE :search OR u.company ILIKE :search)`;
      params.search = `%${filters.search}%`;
    }

    const baseSql = `
      FROM users u
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(l.outstanding_balance), 0) AS total_outstanding,
          COUNT(*) FILTER (WHERE l.status IN ('active','overdue'))  AS active_loans
        FROM loans l WHERE l.borrower_id = u.id
      ) loan_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS missed_payments_count
        FROM payments p WHERE p.borrower_id = u.id AND p.status = 'missed'
      ) pay_agg ON true
      ${whereClause}
    `;

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS total ${baseSql}`,
      params
    );

    const { rows } = await query(
      `SELECT
         u.id, u.lender_id, u.name, u.email, u.phone, u.company,
         u.address_street, u.address_city, u.address_state, u.address_zip,
         u.risk_score, u.risk_level,
         u.created_at, u.updated_at,
         loan_agg.total_outstanding,
         loan_agg.active_loans,
         pay_agg.missed_payments_count
       ${baseSql}
       ORDER BY u.created_at DESC
       LIMIT :pageSize OFFSET :offset`,
      params
    );

    return buildPaginated(
      rows.map(mapBorrower),
      num(countRows[0].total),
      page,
      pageSize
    );
  }


  // getBorrowerById — borrower + their loan summaries

  async getBorrowerById(
    lenderId: string,
    borrowerId: string
  ): Promise<BorrowerWithLoans | null> {
    const { rows: bRows } = await query(
      `SELECT
         u.id, u.lender_id, u.name, u.email, u.phone, u.company,
         u.address_street, u.address_city, u.address_state, u.address_zip,
         u.risk_score, u.risk_level, u.created_at, u.updated_at,
         COALESCE(SUM(l.outstanding_balance), 0)                              AS total_outstanding,
         COUNT(l.id) FILTER (WHERE l.status IN ('active','overdue'))          AS active_loans,
         COUNT(p.id) FILTER (WHERE p.status = 'missed')                       AS missed_payments_count
       FROM users u
       LEFT JOIN loans l    ON l.borrower_id = u.id
       LEFT JOIN payments p ON p.borrower_id = u.id
       WHERE u.id = :borrowerId AND u.lender_id = :lenderId AND u.role = 'borrower'
       GROUP BY u.id`,
      { borrowerId, lenderId }
    );

    if (bRows.length === 0) return null;

    const { rows: lRows } = await query(
      `SELECT id, loan_number, outstanding_balance, status, days_overdue, risk_level
       FROM loans
       WHERE borrower_id = :borrowerId AND lender_id = :lenderId
       ORDER BY created_at DESC`,
      { borrowerId, lenderId }
    );

    const loans = lRows.map((r) => ({
      id: str(r.id),
      loanNumber: str(r.loan_number),
      outstandingBalance: num(r.outstanding_balance),
      status: r.status as BorrowerWithLoans["loans"][0]["status"],
      daysOverdue: num(r.days_overdue),
      riskLevel: (r.risk_level as BorrowerWithLoans["loans"][0]["riskLevel"]) ?? "low",
    }));

    return { ...mapBorrower(bRows[0]), loans };
  }

  
  // getLoans — paginated, with search + status + riskLevel filter
  // Joins users for inline borrower fields

  async getLoans(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<LoanWithBorrower>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const params: Record<string, ParamValue> = { lenderId, pageSize, offset };
    let whereClause = `WHERE l.lender_id = :lenderId`;

    if (filters.status) {
      whereClause += ` AND l.status = :status`;
      params.status = filters.status;
    }

    if (filters.riskLevel) {
      whereClause += ` AND l.risk_level = :riskLevel`;
      params.riskLevel = filters.riskLevel;
    }

    if (filters.search) {
      whereClause += ` AND (l.loan_number ILIKE :search OR u.name ILIKE :search OR u.company ILIKE :search)`;
      params.search = `%${filters.search}%`;
    }

    const baseSql = `
      FROM loans l
      JOIN users u ON u.id = l.borrower_id
      ${whereClause}
    `;

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS total ${baseSql}`,
      params
    );

    const { rows } = await query(
      `SELECT
         l.*,
         u.id           AS borrower_id,
         u.name         AS borrower_name,
         u.email        AS borrower_email,
         u.phone        AS borrower_phone,
         u.company      AS borrower_company,
         u.risk_level   AS borrower_risk_level
       ${baseSql}
       ORDER BY l.created_at DESC
       LIMIT :pageSize OFFSET :offset`,
      params
    );

    const items = rows.map((r) => ({
      ...mapLoan(r),
      borrower: mapBorrowerInline(r),
    }));

    return buildPaginated(items, num(countRows[0].total), page, pageSize);
  }

  // getLoanById — full loan detail: borrower, payments, rec summaries
  
  async getLoanById(
    lenderId: string,
    loanId: string
  ): Promise<LoanWithDetails | null> {
    const { rows } = await query(
      `SELECT
         l.*,
         u.id           AS borrower_id,
         u.name         AS borrower_name,
         u.email        AS borrower_email,
         u.phone        AS borrower_phone,
         u.company      AS borrower_company,
         u.risk_level   AS borrower_risk_level
       FROM loans l
       JOIN users u ON u.id = l.borrower_id
       WHERE l.id = :loanId AND l.lender_id = :lenderId`,
      { loanId, lenderId }
    );

    if (rows.length === 0) return null;

    const { rows: payRows } = await query(
      `SELECT p.*, l.lender_id, l.borrower_id
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE p.loan_id = :loanId
       ORDER BY p.scheduled_date DESC`,
      { loanId }
    );

    const { rows: recRows } = await query(
      `SELECT id, recommended_action, status, summary, confidence_score, created_at
       FROM strategies
       WHERE loan_id = :loanId AND lender_id = :lenderId
       ORDER BY created_at DESC`,
      { loanId, lenderId }
    );

    const recommendations = recRows.map((r) => ({
      id: str(r.id),
      action: (r.recommended_action ?? "email_reminder") as RecoveryRecommendationWithContext["action"],
      status: r.status as RecoveryRecommendationWithContext["status"],
      title: str(r.recommended_action),
      confidenceScore: num(r.confidence_score),
      generatedAt: str(r.created_at),
    }));

    return {
      ...mapLoan(rows[0]),
      borrower: mapBorrowerInline(rows[0]),
      payments: payRows.map(mapPayment),
      recommendations,
    };
  }

  
  // getOverdueLoans — no pagination, all overdue/default loans
  
  async getOverdueLoans(lenderId: string): Promise<LoanWithBorrower[]> {
    const { rows } = await query(
      `SELECT
         l.*,
         u.id           AS borrower_id,
         u.name         AS borrower_name,
         u.email        AS borrower_email,
         u.phone        AS borrower_phone,
         u.company      AS borrower_company,
         u.risk_level   AS borrower_risk_level
       FROM loans l
       JOIN users u ON u.id = l.borrower_id
       WHERE l.lender_id = :lenderId
         AND l.status IN ('overdue', 'default')
       ORDER BY l.days_overdue DESC`,
      { lenderId }
    );

    return rows.map((r) => ({
      ...mapLoan(r),
      borrower: mapBorrowerInline(r),
    }));
  }

  // getMissedPayments — all missed payment rows for a lender

  async getMissedPayments(lenderId: string): Promise<Payment[]> {
    const { rows } = await query(
      `SELECT p.*, l.lender_id, l.borrower_id
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE l.lender_id = :lenderId
         AND p.status = 'missed'
       ORDER BY p.scheduled_date DESC`,
      { lenderId }
    );

    return rows.map(mapPayment);
  }

  // getRecommendations — paginated strategies with joined context
  
  async getRecommendations(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<RecoveryRecommendationWithContext>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const params: Record<string, ParamValue> = { lenderId, pageSize, offset };
    let whereClause = `WHERE s.lender_id = :lenderId`;

    if (filters.status) {
      whereClause += ` AND s.status = :status`;
      params.status = filters.status;
    }

    if (filters.search) {
      whereClause += ` AND (s.summary ILIKE :search OR u.name ILIKE :search)`;
      params.search = `%${filters.search}%`;
    }

    const baseSql = `
      FROM strategies s
      JOIN loans  l ON l.id = s.loan_id
      JOIN users  u ON u.id = l.borrower_id
      LEFT JOIN ai_insights ai ON ai.id = s.insight_id
      ${whereClause}
    `;

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS total ${baseSql}`,
      params
    );

    const { rows } = await query(
      `SELECT
         s.*,
         l.loan_number, l.outstanding_balance, l.days_overdue,
         l.status          AS loan_status,
         l.risk_level,
         u.id              AS borrower_id,
         u.name            AS borrower_name,
         u.email           AS borrower_email,
         u.phone           AS borrower_phone,
         u.company         AS borrower_company,
         u.risk_level      AS borrower_risk_level,
         u.risk_score      AS borrower_risk_score,
         ai.reasoning
       ${baseSql}
       ORDER BY s.created_at DESC
       LIMIT :pageSize OFFSET :offset`,
      params
    );

    return buildPaginated(
      rows.map(mapRecommendation),
      num(countRows[0].total),
      page,
      pageSize
    );
  }
  
  // getRecommendationById — single strategy with full context

  async getRecommendationById(
    lenderId: string,
    recommendationId: string
  ): Promise<RecoveryRecommendationWithContext | null> {
    const { rows } = await query(
      `SELECT
         s.*,
         l.loan_number, l.outstanding_balance, l.days_overdue,
         l.status          AS loan_status,
         l.risk_level,
         u.id              AS borrower_id,
         u.name            AS borrower_name,
         u.email           AS borrower_email,
         u.phone           AS borrower_phone,
         u.company         AS borrower_company,
         u.risk_level      AS borrower_risk_level,
         u.risk_score      AS borrower_risk_score,
         ai.reasoning
       FROM strategies s
       JOIN loans  l ON l.id = s.loan_id
       JOIN users  u ON u.id = l.borrower_id
       LEFT JOIN ai_insights ai ON ai.id = s.insight_id
       WHERE s.id = :recommendationId AND s.lender_id = :lenderId`,
      { recommendationId, lenderId }
    );

    if (rows.length === 0) return null;
    return mapRecommendation(rows[0]);
  }

  // getRecentRecommendations — last N strategies for dashboard
  
  async getRecentRecommendations(
    lenderId: string,
    limit = 5
  ): Promise<RecoveryRecommendationWithContext[]> {
    const { rows } = await query(
      `SELECT
         s.*,
         l.loan_number, l.outstanding_balance, l.days_overdue,
         l.status          AS loan_status,
         l.risk_level,
         u.id              AS borrower_id,
         u.name            AS borrower_name,
         u.email           AS borrower_email,
         u.phone           AS borrower_phone,
         u.company         AS borrower_company,
         u.risk_level      AS borrower_risk_level,
         u.risk_score      AS borrower_risk_score,
         ai.reasoning
       FROM strategies s
       JOIN loans  l ON l.id = s.loan_id
       JOIN users  u ON u.id = l.borrower_id
       LEFT JOIN ai_insights ai ON ai.id = s.insight_id
       WHERE s.lender_id = :lenderId
       ORDER BY s.created_at DESC
       LIMIT :limit`,
      { lenderId, limit }
    );

    return rows.map(mapRecommendation);
  }

  
  // getRules — all active + inactive rules, sorted by priority
  
  async getRules(lenderId: string): Promise<LenderRule[]> {
    const { rows } = await query(
      `SELECT *
       FROM lender_rules
       WHERE lender_id = :lenderId
       ORDER BY priority ASC`,
      { lenderId }
    );

    return rows.map(mapRule);
  }

  
  // getAuditLogs — paginated, sorted newest-first, search support
  
  async getAuditLogs(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<AuditLog>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const params: Record<string, ParamValue> = { lenderId, pageSize, offset };
    let whereClause = `WHERE lender_id = :lenderId`;

    if (filters.search) {
      whereClause += ` AND (description ILIKE :search OR user_name ILIKE :search OR entity_label ILIKE :search)`;
      params.search = `%${filters.search}%`;
    }

    const { rows: countRows } = await query(
      `SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`,
      params
    );

    const { rows } = await query(
      `SELECT *
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT :pageSize OFFSET :offset`,
      params
    );

    return buildPaginated(
      rows.map(mapAuditLog),
      num(countRows[0].total),
      page,
      pageSize
    );
  }
}

export const auroraDataRepository = new AuroraDataRepository();