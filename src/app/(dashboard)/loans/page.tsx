import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface LoansPageProps {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const params = await searchParams;
  const repo = getDataRepository();
  const { data: loans, total } = await repo.getLoans(DEFAULT_LENDER_ID, {
    pageSize: 50,
    status: params.status,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description={`${total} loans in your portfolio`}
      />

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: undefined },
          { label: "Active", value: "active" },
          { label: "Overdue", value: "overdue" },
          { label: "Default", value: "default" },
          { label: "Paid Off", value: "paid_off" },
        ].map((filter) => {
          const isActive = params.status === filter.value || (!params.status && !filter.value);
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/loans?status=${filter.value}` : "/loans"}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {loans.length === 0 ? (
        <EmptyState
          title="No loans found"
          description="Try adjusting your filters."
          icon={<FileText className="h-10 w-10" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">Loan #</th>
                    <th className="text-left font-medium p-4">Borrower</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-right font-medium p-4">Balance</th>
                    <th className="text-right font-medium p-4 hidden sm:table-cell">
                      Payment
                    </th>
                    <th className="text-right font-medium p-4">Overdue</th>
                    <th className="text-left font-medium p-4">Risk</th>
                    <th className="text-left font-medium p-4 hidden lg:table-cell">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="font-mono font-medium hover:text-primary transition-colors"
                        >
                          {loan.loanNumber}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/borrowers/${loan.borrower.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          <p className="font-medium">
                            {loan.borrower.firstName} {loan.borrower.lastName}
                          </p>
                          {loan.borrower.company && (
                            <p className="text-xs text-muted-foreground">
                              {loan.borrower.company}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(loan.outstandingBalance)}
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell text-muted-foreground">
                        {formatCurrency(loan.monthlyPayment)}/mo
                      </td>
                      <td className="p-4 text-right">
                        {loan.daysOverdue > 0 ? (
                          <span className="text-red-600 font-medium">
                            {loan.daysOverdue}d
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={loan.riskLevel} type="risk" />
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">
                        {loan.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
