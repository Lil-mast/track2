import type { RiskLevel, LoanStatus, RecommendationStatus, RecoveryAction } from "@/types/index";

export const riskLevelConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
};

export const loanStatusConfig: Record<
  LoanStatus,
  { label: string; className: string }
> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800 border-red-200" },
  default: { label: "Default", className: "bg-red-200 text-red-900 border-red-300" },
  paid_off: { label: "Paid Off", className: "bg-slate-100 text-slate-700 border-slate-200" },
  charged_off: { label: "Charged Off", className: "bg-slate-200 text-slate-800 border-slate-300" },
};

export const recommendationStatusConfig: Record<
  RecommendationStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-200" },
  rejected: { label: "Rejected", className: "bg-slate-100 text-slate-700 border-slate-200" },
  executed: { label: "Executed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export const recoveryActionLabels: Record<RecoveryAction, string> = {
  email_reminder: "Email Reminder",
  sms_reminder: "SMS Reminder",
  phone_call: "Phone Call",
  payment_plan: "Payment Plan",
  hardship_review: "Hardship Review",
  legal_notice: "Legal Notice",
  collections_referral: "Collections Referral",
};

export const aiActionLabels: Record<string, string> = {
  remind: "Remind",
  renegotiate: "Renegotiate",
  escalate: "Escalate",
};

export const auditActionLabels: Record<string, string> = {
  login: "Login",
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  reject: "Reject",
  execute: "Execute",
  export: "Export",
};

export const ruleTriggerLabels: Record<string, string> = {
  days_overdue: "Days Overdue",
  missed_payments: "Missed Payments",
  risk_score: "Risk Score",
  balance_threshold: "Balance Threshold",
};

export const ruleOperatorLabels: Record<string, string> = {
  gte: "≥",
  lte: "≤",
  eq: "=",
  gt: ">",
  lt: "<",
};
