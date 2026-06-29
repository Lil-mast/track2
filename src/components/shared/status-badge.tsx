import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high" | "critical";
type LoanStatus = "active" | "overdue" | "default" | "paid_off" | "charged_off";
type RecommendationStatus = "pending" | "approved" | "rejected" | "executed" | "expired";

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  high: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  critical: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const loanStatusConfig: Record<LoanStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  default: { label: "Default", className: "bg-red-600/10 text-red-300 border-red-600/20" },
  paid_off: { label: "Paid Off", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  charged_off: { label: "Charged Off", className: "bg-slate-600/10 text-slate-400 border-slate-600/20" },
};

const recStatusConfig: Record<RecommendationStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  rejected: { label: "Rejected", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  executed: { label: "Executed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  expired: { label: "Expired", className: "bg-slate-600/10 text-slate-500 border-slate-600/20" },
};

interface StatusBadgeProps {
  status: string;
  type: "risk" | "loan" | "recommendation";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let config: { label: string; className: string } | undefined;

  if (type === "risk") config = riskConfig[status as RiskLevel];
  else if (type === "loan") config = loanStatusConfig[status as LoanStatus];
  else config = recStatusConfig[status as RecommendationStatus];

  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
