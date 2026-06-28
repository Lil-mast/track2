import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { recoveryActionLabels } from "@/lib/labels";
import { LoanStrategies } from "@/components/recovery/loan-strategies";

interface LoanDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = await params;
  const repo = getDataRepository();
  const loan = await repo.getLoanById(DEFAULT_LENDER_ID, id);

  if (!loan) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/loans">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Loans
        </Link>
      </Button>

      <PageHeader
        title={loan.loanNumber}
        description={`${loan.borrower.firstName} ${loan.borrower.lastName}${loan.borrower.company ? ` · ${loan.borrower.company}` : ""}`}
      >
        <div className="flex gap-2">
          <StatusBadge status={loan.status} />
          <StatusBadge status={loan.riskLevel} type="risk" />
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(loan.outstandingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monthly Payment</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(loan.monthlyPayment)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Days Overdue</p>
            <p
              className={`text-2xl font-bold mt-1 ${loan.daysOverdue > 0 ? "text-red-600" : ""}`}
            >
              {loan.daysOverdue > 0 ? loan.daysOverdue : "Current"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Missed Payments</p>
            <p className="text-2xl font-bold mt-1 text-red-600">
              {loan.missedPaymentsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Principal</p>
              <p className="font-medium">{formatCurrency(loan.principalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Interest Rate</p>
              <p className="font-medium">{loan.interestRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Term</p>
              <p className="font-medium">{loan.termMonths} months</p>
            </div>
            <div>
              <p className="text-muted-foreground">Purpose</p>
              <p className="font-medium">{loan.purpose}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Origination</p>
              <p className="font-medium">{formatDate(loan.originationDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Maturity</p>
              <p className="font-medium">{formatDate(loan.maturityDate)}</p>
            </div>
            {loan.collateral && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Collateral</p>
                <p className="font-medium">{loan.collateral}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendations
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recovery">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loan.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recommendations for this loan yet.
              </p>
            ) : (
              <div className="space-y-3">
                {loan.recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/recovery/${rec.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {recoveryActionLabels[rec.action]}
                      </p>
                    </div>
                    <StatusBadge status={rec.status} type="recommendation" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LoanStrategies
        loanId={loan.id}
        lenderId={DEFAULT_LENDER_ID}
        borrowerId={loan.borrowerId}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Scheduled</th>
                  <th className="text-right font-medium p-4">Amount</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-left font-medium p-4 hidden sm:table-cell">
                    Paid Date
                  </th>
                  <th className="text-left font-medium p-4 hidden md:table-cell">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {loan.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="p-4">{formatDate(payment.scheduledDate)}</td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          payment.status === "paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : payment.status === "missed"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : payment.status === "partial"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground">
                      {payment.paidDate ? formatDate(payment.paidDate) : "—"}
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">
                      {payment.paymentMethod ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
