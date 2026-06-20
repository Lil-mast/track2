export const APP_NAME = "RecoverIQ";
export const APP_DESCRIPTION =
  "AI-powered loan recovery platform for B2B lenders";

/** Default lender ID for mock single-tenant MVP */
export const DEFAULT_LENDER_ID = "lender_001";

export const LOAN_STATUSES = [
  "active",
  "overdue",
  "default",
  "paid_off",
  "charged_off",
] as const;

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export const RECOVERY_ACTIONS = [
  "email_reminder",
  "sms_reminder",
  "phone_call",
  "payment_plan",
  "hardship_review",
  "legal_notice",
  "collections_referral",
] as const;

export const RECOMMENDATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "executed",
  "expired",
] as const;

export const AUDIT_ACTIONS = [
  "login",
  "view",
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "execute",
  "export",
] as const;

export const AUDIT_ENTITY_TYPES = [
  "borrower",
  "loan",
  "payment",
  "recommendation",
  "rule",
  "user",
  "settings",
] as const;
