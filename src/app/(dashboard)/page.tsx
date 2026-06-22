import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
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
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { recoveryActionLabels } from "@/lib/labels";

export default async function DashboardPage() {
  const repo = getDataRepository();
  const [stats, recentRecommendations, overdueLoans] = await Promise.all([
    repo.getDashboardStats(DEFAULT_LENDER_ID),
    repo.getRecentRecommendations(DEFAULT_LENDER_ID, 5),
    repo.getOverdueLoans(DEFAULT_LENDER_ID),
  ]);

  const topOverdue = overdueLoans
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your loan portfolio and AI recovery insights"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Recent AI Recommendations
              </CardTitle>
              <CardDescription>
                Latest recovery actions suggested by AI
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recovery">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRecommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/recovery/${rec.id}`}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.borrower.firstName} {rec.borrower.lastName}
                      {rec.borrower.company && ` · ${rec.borrower.company}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
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
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Overdue Accounts</CardTitle>
              <CardDescription>
                Loans requiring immediate attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/loans?status=overdue">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOverdue.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/loans/${loan.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {loan.borrower.company ??
                        `${loan.borrower.firstName} ${loan.borrower.lastName}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {loan.loanNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(loan.outstandingBalance)}
                      </p>
                      <p className="text-xs text-red-600 font-medium">
                        {loan.daysOverdue} days overdue
                      </p>
                    </div>
                    <StatusBadge status={loan.riskLevel} type="risk" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">Portfolio Summary</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total outstanding:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(stats.totalOutstanding)}
              </span>
              {" · "}
              Recovery rate:{" "}
              <span className="font-medium text-emerald-600">
                {Math.round(stats.recoveryRate * 100)}%
              </span>
            </p>
          </div>
          <Button asChild>
            <Link href="/recovery">
              Review Pending Recommendations
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
