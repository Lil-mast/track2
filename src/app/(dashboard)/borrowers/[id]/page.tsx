import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BorrowerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BorrowerDetailPage({
  params,
}: BorrowerDetailPageProps) {
  const { id } = await params;
  const repo = getDataRepository();
  const borrower = await repo.getBorrowerById(DEFAULT_LENDER_ID, id);

  if (!borrower) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/borrowers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${borrower.firstName} ${borrower.lastName}`}
        description={borrower.company}
      >
        <StatusBadge status={borrower.riskLevel} type="risk" />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p>{borrower.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p>{borrower.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Address</p>
              <p>
                {borrower.address.street}, {borrower.address.city},{" "}
                {borrower.address.state} {borrower.address.zip}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Score</span>
              <span className="font-semibold">{borrower.riskScore}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk Level</span>
              <StatusBadge status={borrower.riskLevel} type="risk" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Missed Payments</span>
              <span className="font-semibold text-red-600">
                {borrower.missedPaymentsCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Contact</span>
              <span>
                {borrower.lastContactDate
                  ? formatDate(borrower.lastContactDate)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Outstanding</span>
              <span className="font-semibold">
                {formatCurrency(borrower.totalOutstanding)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Loans</span>
              <span>{borrower.activeLoans}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {borrower.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{borrower.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Loan Number</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-right font-medium p-4">Balance</th>
                  <th className="text-right font-medium p-4">Days Overdue</th>
                  <th className="text-left font-medium p-4">Risk</th>
                </tr>
              </thead>
              <tbody>
                {borrower.loans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-0">
                    <td className="p-4">
                      <Link
                        href={`/loans/${loan.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {loan.loanNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(loan.outstandingBalance)}
                    </td>
                    <td className="p-4 text-right">
                      {loan.daysOverdue > 0 ? (
                        <span className="text-red-600 font-medium">
                          {loan.daysOverdue}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={loan.riskLevel} type="risk" />
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
