import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function BorrowersPage() {
  const repo = getDataRepository();
  const { data: borrowers, total } = await repo.getBorrowers(
    DEFAULT_LENDER_ID,
    { pageSize: 50 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowers"
        description={`${total} borrowers in your portfolio`}
      />

      {borrowers.length === 0 ? (
        <EmptyState
          title="No borrowers found"
          description="Borrowers will appear here once added to your portfolio."
          icon={<Users className="h-10 w-10" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">Borrower</th>
                    <th className="text-left font-medium p-4 hidden md:table-cell">
                      Company
                    </th>
                    <th className="text-left font-medium p-4 hidden lg:table-cell">
                      Contact
                    </th>
                    <th className="text-left font-medium p-4">Risk</th>
                    <th className="text-right font-medium p-4">Outstanding</th>
                    <th className="text-right font-medium p-4 hidden sm:table-cell">
                      Loans
                    </th>
                    <th className="text-right font-medium p-4 hidden lg:table-cell">
                      Missed
                    </th>
                    <th className="text-right font-medium p-4 hidden xl:table-cell">
                      Last Contact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {borrowers.map((borrower) => (
                    <tr
                      key={borrower.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          href={`/borrowers/${borrower.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {borrower.firstName} {borrower.lastName}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {borrower.id}
                        </p>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {borrower.company ?? "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <p className="text-muted-foreground">{borrower.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {borrower.phone}
                        </p>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={borrower.riskLevel} type="risk" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: {borrower.riskScore}
                        </p>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(borrower.totalOutstanding)}
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell">
                        {borrower.activeLoans}
                      </td>
                      <td className="p-4 text-right hidden lg:table-cell">
                        {borrower.missedPaymentsCount > 0 ? (
                          <span className="text-red-600 font-medium">
                            {borrower.missedPaymentsCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-muted-foreground hidden xl:table-cell">
                        {borrower.lastContactDate
                          ? formatDate(borrower.lastContactDate)
                          : "—"}
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
