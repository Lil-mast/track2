import { cn } from "../../lib/utils";
import {
  riskLevelConfig,
  loanStatusConfig,
  recommendationStatusConfig,
  type RiskLevel,
  type LoanStatus,
  type RecommendationStatus,
} from "../../types/index";

interface StatusBadgeProps {
  status: string;
  type: "risk" | "loan" | "recommendation";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let config: { label: string; className: string } | undefined;

  if (type === "risk") {
    config = riskLevelConfig[status as RiskLevel];
  } else if (type === "loan") {
    config = loanStatusConfig[status as LoanStatus];
  } else if (type === "recommendation") {
    config = recommendationStatusConfig[status as RecommendationStatus];
  }

  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-border text-muted-foreground">
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
