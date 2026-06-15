export type LoanStatus =
  | "active"
  | "overdue"
  | "default"
  | "paid_off"
  | "charged_off";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RecoveryAction =
  | "email_reminder"
  | "sms_reminder"
  | "phone_call"
  | "payment_plan"
  | "hardship_review"
  | "legal_notice"
  | "collections_referral";

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "expired";

export type PaymentStatus = "scheduled" | "paid" | "missed" | "partial" | "failed";

export type AuditAction =
  | "login"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "execute"
  | "export";

export type AuditEntityType =
  | "borrower"
  | "loan"
  | "payment"
  | "recommendation"
  | "rule"
  | "user"
  | "settings";

export type RuleTrigger =
  | "days_overdue"
  | "missed_payments"
  | "risk_score"
  | "balance_threshold";

export type RuleOperator = "gte" | "lte" | "eq" | "gt" | "lt";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  highRiskAccounts: number;
  totalOutstanding: number;
  recoveryRate: number;
}

export interface ListFilters {
  search?: string;
  status?: string;
  riskLevel?: RiskLevel;
  page?: number;
  pageSize?: number;
}
