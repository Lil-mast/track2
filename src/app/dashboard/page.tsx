import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type RecoveryAction =
  | "email_reminder"
  | "sms_reminder"
  | "phone_call"
  | "payment_plan"
  | "hardship_review"
  | "legal_notice"
  | "collections_referral";

type RecommendationStatus = "pending" | "approved" | "rejected" | "executed" | "expired";
type RiskLevel = "low" | "medium" | "high" | "critical";

const recoveryActionLabels: Record<RecoveryAction, string> = {
  email_reminder: "Email Reminder",
  sms_reminder: "SMS Reminder",
  phone_call: "Phone Call",
  payment_plan: "Payment Plan",
  hardship_review: "Hardship Review",
  legal_notice: "Legal Notice",
  collections_referral: "Collections Referral",
};

const stats = {
  totalLoans: 14,
  activeLoans: 3,
  overdueLoans: 9,
  highRiskAccounts: 4,
  totalOutstanding: 3_665_000,
  recoveryRate: 0.78,
};

const recentRecommendations = [
  {
    id: "rec_001",
    title: "Issue Formal Demand Letter",
    action: "legal_notice" as RecoveryAction,
    status: "pending" as RecommendationStatus,
    confidenceScore: 0.92,
    generatedAt: "2025-06-08T08:30:00Z",
    borrower: { firstName: "Robert", lastName: "Kim", company: "Pacific Builders Inc." },
  },
  {
    id: "rec_002",
    title: "Propose Restructured Payment Plan",
    action: "payment_plan" as RecoveryAction,
    status: "pending" as RecommendationStatus,
    confidenceScore: 0.87,
    generatedAt: "2025-06-07T14:15:00Z",
    borrower: { firstName: "Wei", lastName: "Chen", company: "Apex Logistics Group" },
  },
  {
    id: "rec_003",
    title: "Conduct Hardship Review",
    action: "hardship_review" as RecoveryAction,
    status: "approved" as RecommendationStatus,
    confidenceScore: 0.79,
    generatedAt: "2025-06-06T10:00:00Z",
    borrower: { firstName: "Marcus", lastName: "Webb", company: "NovaBio Health Sciences" },
  },
  {
    id: "rec_004",
    title: "Priority Outbound Call to CFO",
    action: "phone_call" as RecoveryAction,
    status: "executed" as RecommendationStatus,
    confidenceScore: 0.84,
    generatedAt: "2025-06-05T11:00:00Z",
    borrower: { firstName: "Sarah", lastName: "Whitfield", company: "Steel & Sons Mfg." },
  },
  {
    id: "rec_005",
    title: "Send Payment Reminder Email",
    action: "email_reminder" as RecoveryAction,
    status: "executed" as RecommendationStatus,
    confidenceScore: 0.91,
    generatedAt: "2025-06-04T09:00:00Z",
    borrower: { firstName: "Alex", lastName: "Torres", company: "TechVault Solutions" },
  },
];

const overdueLoans = [
  {
    id: "loan_011",
    loanNumber: "MCP-2022-001890",
    outstandingBalance: 780_000,
    daysOverdue: 130,
    riskLevel: "critical" as RiskLevel,
    borrowerName: "Pacific Builders Inc.",
  },
  {
    id: "loan_012",
    loanNumber: "MCP-2023-007890",
    outstandingBalance: 320_000,
    daysOverdue: 102,
    riskLevel: "critical" as RiskLevel,
    borrowerName: "Pacific Builders Inc.",
  },
  {
    id: "loan_001",
    loanNumber: "MCP-2023-004521",
    outstandingBalance: 385_000,
    daysOverdue: 71,
    riskLevel: "critical" as RiskLevel,
    borrowerName: "Apex Logistics Group",
  },
  {
    id: "loan_009",
    loanNumber: "MCP-2023-003456",
    outstandingBalance: 420_000,
    daysOverdue: 71,
    riskLevel: "high" as RiskLevel,
    borrowerName: "NovaBio Health Sciences",
  },
  {
    id: "loan_002",
    loanNumber: "MCP-2024-007834",
    outstandingBalance: 100_000,
    daysOverdue: 41,
    riskLevel: "high" as RiskLevel,
    borrowerName: "Apex Logistics Group",
  },
];

const statusIcons: Record<RecommendationStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  executed: CheckCircle,
  rejected: XCircle,
  expired: XCircle,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your loan portfolio and AI recovery insights"
      >
        <Button variant="gradient" size="sm" asChild>
          <Link href="/dashboard/recovery">
            <Sparkles className="h-4 w-4" />
            New Recovery Run
          </Link>
        </Button>
      </PageHeader>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Loans"
          value={stats.totalLoans}
          description="Across all statuses"
          icon={FileText}
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          description="Currently performing"
          icon={TrendingUp}
          trend={{ value: "+2", positive: true }}
        />
        <StatCard
          title="Overdue Loans"
          value={stats.overdueLoans}
          description="Require attention"
          icon={AlertTriangle}
          trend={{ value: "+1", positive: false }}
        />
        <StatCard
          title="High Risk Accounts"
          value={stats.highRiskAccounts}
          description="High or critical risk"
          icon={Users}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Recommendations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recent AI Recommendations
              </CardTitle>
              <CardDescription>
                Latest recovery actions suggested by AI
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/recovery">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRecommendations.map((rec) => {
                const StatusIcon = statusIcons[rec.status] ?? Clock;
                return (
                  <div
                    key={rec.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/50 p-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">
                        {rec.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rec.borrower.firstName} {rec.borrower.lastName}
                        {rec.borrower.company && ` · ${rec.borrower.company}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {recoveryActionLabels[rec.action]}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-primary">
                          {Math.round(rec.confidenceScore * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={rec.status} type="recommendation" />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(rec.generatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overdue Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Overdue Accounts</CardTitle>
              <CardDescription>
                Loans requiring immediate attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/loans">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">
                      {loan.borrowerName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {loan.loanNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(loan.outstandingBalance)}
                      </p>
                      <p className="text-xs text-red-400 font-medium">
                        {loan.daysOverdue} days overdue
                      </p>
                    </div>
                    <StatusBadge status={loan.riskLevel} type="risk" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio summary banner */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold text-foreground">Portfolio Summary</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total outstanding:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(stats.totalOutstanding)}
              </span>
              {" · "}
              Recovery rate:{" "}
              <span className="font-medium text-emerald-400">
                {Math.round(stats.recoveryRate * 100)}%
              </span>
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/recovery">
              Review Pending Recommendations
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
