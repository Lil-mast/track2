export type RiskLevel = "low" | "medium" | "high" | "critical";

export type LoanStatus =
  | "active"
  | "overdue"
  | "default"
  | "paid_off"
  | "charged_off";

export type RecommendationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "expired";

export type RecoveryAction =
  | "email_reminder"
  | "sms_reminder"
  | "phone_call"
  | "payment_plan"
  | "hardship_review"
  | "legal_notice"
  | "collections_referral";

export const riskLevelConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export const loanStatusConfig: Record<
  LoanStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  default: {
    label: "Default",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  paid_off: {
    label: "Paid Off",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  charged_off: {
    label: "Charged Off",
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
};

export const recommendationStatusConfig: Record<
  RecommendationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  rejected: {
    label: "Rejected",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  executed: {
    label: "Executed",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
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
