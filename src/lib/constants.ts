export const APP_NAME = "RecoverIQ";
export const APP_DESCRIPTION =
  "AI-powered loan recovery platform for B2B lenders";

/** Demo lender UUID in Aurora seed data */
export const DEMO_LENDER_ID = "b0000001-0000-0000-0000-000000000001";

/** Default lender ID — mock locally, demo UUID when Aurora is enabled */
export const DEFAULT_LENDER_ID =
  process.env.AURORA_ENABLED === "true"
    ? (process.env.DEMO_LENDER_ID ?? DEMO_LENDER_ID)
    : "lender_001";

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
