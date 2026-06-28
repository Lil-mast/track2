import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StrategyActions } from "@/components/recovery/strategy-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { recoveryActionLabels } from "@/lib/labels";

interface RecoveryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecoveryDetailPage({
  params,
}: RecoveryDetailPageProps) {
  const { id } = await params;
  const repo = getDataRepository();
  const rec = await repo.getRecommendationById(DEFAULT_LENDER_ID, id);

  if (!rec) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/recovery">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Recommendations
        </Link>
      </Button>

      <PageHeader title={rec.title} description={rec.summary}>
        <div className="flex gap-2">
          <StatusBadge status={rec.status} type="recommendation" />
          <StatusBadge status={rec.riskLevel} type="risk" />
        </div>
      </PageHeader>

      <StrategyActions
        strategyId={rec.id}
        lenderId={rec.lenderId}
        initialStatus={rec.status}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Stored AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Reasoning</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rec.reasoning}
                </p>
              </div>
              {rec.suggestedScript && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Suggested Script</p>
                    <div className="rounded-lg bg-muted p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                      {rec.suggestedScript}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/loans/${rec.loan.id}`}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-mono font-medium">{rec.loan.loanNumber}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.borrower.firstName} {rec.borrower.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(rec.loan.outstandingBalance)}
                  </p>
                  <p className="text-sm text-red-600">
                    {rec.loan.daysOverdue > 0
                      ? `${rec.loan.daysOverdue} days overdue`
                      : "Current"}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Recommendation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action</span>
                <span className="font-medium">
                  {recoveryActionLabels[rec.action]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-bold text-primary">
                  {Math.round(rec.confidenceScore * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span>P{rec.priority}</span>
              </div>
              {rec.expectedRecoveryAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Recovery</span>
                  <span className="font-medium">
                    {formatCurrency(rec.expectedRecoveryAmount)}
                  </span>
                </div>
              )}
              {rec.expectedRecoveryRate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recovery Rate</span>
                  <span>{Math.round(rec.expectedRecoveryRate * 100)}%</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Model</span>
                <span className="font-mono text-xs">{rec.aiModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated</span>
                <span>{formatDateTime(rec.generatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{formatDateTime(rec.expiresAt)}</span>
              </div>
              {rec.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span>{formatDateTime(rec.reviewedAt)}</span>
                </div>
              )}
              {rec.reviewedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed By</span>
                  <span>{rec.reviewedBy}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Borrower</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">
                  {rec.borrower.firstName} {rec.borrower.lastName}
                </p>
                {rec.borrower.company && (
                  <p className="text-muted-foreground">{rec.borrower.company}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p>{rec.borrower.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p>{rec.borrower.phone}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-semibold">{rec.borrower.riskScore}/100</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/borrowers/${rec.borrower.id}`}>
                  View Borrower Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
