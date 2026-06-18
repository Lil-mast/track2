import { cn } from "@/lib/utils";
import type { RiskLevel, LoanStatus, RecommendationStatus } from "@/types/index";
import {
  riskLevelConfig,
  loanStatusConfig,
  recommendationStatusConfig,
} from "@/lib/labels";

interface StatusBadgeProps {
  status: LoanStatus | RecommendationStatus | RiskLevel | string;
  type?: "loan" | "recommendation" | "risk";
  className?: string;
}

export function StatusBadge({ status, type = "loan", className }: StatusBadgeProps) {
  let config: { label: string; className: string };

  if (type === "risk") {
    config = riskLevelConfig[status as RiskLevel] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700",
    };
  } else if (type === "recommendation") {
    config = recommendationStatusConfig[status as RecommendationStatus] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700",
    };
  } else {
    config = loanStatusConfig[status as LoanStatus] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700",
    };
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
