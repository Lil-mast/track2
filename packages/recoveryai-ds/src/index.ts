// Utilities
export { cn, formatCurrency, formatDate, formatDateTime, daysOverdue } from "./lib/utils";

// Types & config maps
export type {
  RiskLevel,
  LoanStatus,
  RecommendationStatus,
  RecoveryAction,
} from "./types/index";
export {
  riskLevelConfig,
  loanStatusConfig,
  recommendationStatusConfig,
  recoveryActionLabels,
} from "./types/index";

// UI Components
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps } from "./components/ui/badge";
export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";
export { ScrollArea, ScrollBar } from "./components/ui/scroll-area";

// Shared Components
export { StatCard } from "./components/shared/stat-card";
export { StatusBadge } from "./components/shared/status-badge";
export { PageHeader } from "./components/shared/page-header";
