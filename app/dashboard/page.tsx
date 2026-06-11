import Link from "next/link";
import { TrendingUp, Users, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { RecoveryTrendChart, RiskDistributionChart } from "@/components/dashboard/charts";
import { borrowers, formatCurrency, riskColorClass } from "@/lib/data";

const stats = [
  {
    label: "Recovery Rate",
    value: "68.4%",
    detail: "+5.2% this quarter",
    icon: TrendingUp,
  },
  {
    label: "Active Loan Accounts",
    value: "2,318",
    detail: "$4.2M outstanding",
    icon: Users,
  },
  {
    label: "High-Risk Accounts",
    value: "142",
    detail: "risk score above 80",
    icon: AlertTriangle,
  },
  {
    label: "AI Recommendations",
    value: "37",
    detail: "pending review",
    icon: Lightbulb,
  },
];

export default function DashboardPage() {
  const priorityAccounts = [...borrowers]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Portfolio recovery performance and AI-prioritized accounts.
        </p>
      </header>

      {/* Stat cards */}
      <section
        aria-label="Key metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <stat.icon className="size-4 text-primary" aria-hidden="true" />
              {stat.label}
            </span>
            <span className="text-2xl font-semibold tabular-nums">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.detail}</span>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section aria-label="Charts" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Recovery Trend</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Recovered vs. at-risk balances, last 6 months
          </p>
          <RecoveryTrendChart />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Risk Score Distribution</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Active accounts grouped by AI risk score
          </p>
          <RiskDistributionChart />
        </div>
      </section>

      {/* Priority accounts */}
      <section aria-label="Priority accounts" className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Priority Accounts</h2>
            <p className="text-xs text-muted-foreground">
              Highest risk scores requiring action
            </p>
          </div>
          <Link
            href="/dashboard/borrowers"
            className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Borrower</th>
                <th scope="col" className="px-5 py-3 font-medium">Outstanding</th>
                <th scope="col" className="px-5 py-3 font-medium">Missed</th>
                <th scope="col" className="px-5 py-3 font-medium">Risk</th>
                <th scope="col" className="px-5 py-3 font-medium">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {priorityAccounts.map((borrower) => (
                <tr key={borrower.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/borrowers/${borrower.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {borrower.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{borrower.company}</p>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums">
                    {formatCurrency(borrower.outstanding)}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums">{borrower.missedPayments}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${riskColorClass(borrower.riskLevel)}`}
                    >
                      {borrower.riskScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {borrower.recommendedAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
