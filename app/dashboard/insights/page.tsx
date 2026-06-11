import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { borrowers, actionBreakdown, riskColorClass } from "@/lib/data";

export const metadata = {
  title: "AI Insights — RecoveryAI",
};

export default function InsightsPage() {
  const actionable = borrowers.filter(
    (b) => b.recommendedAction !== "No Action Needed",
  );
  const totalActions = actionBreakdown.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Recovery recommendations generated from live borrower data.
        </p>
      </header>

      {/* Action breakdown */}
      <section
        aria-label="Recommended action breakdown"
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold">Recommended Actions This Month</h2>
        <p className="text-xs text-muted-foreground">
          {totalActions} recommendations across the portfolio
        </p>
        <div className="mt-5 flex flex-col gap-4">
          {actionBreakdown.map((item) => (
            <div key={item.action} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{item.action}</span>
                <span className="tabular-nums text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / totalActions) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation feed */}
      <section aria-label="Recommendation feed" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Latest Recommendations</h2>
        {actionable.map((b) => (
          <article
            key={b.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{b.name}</span>
                <span className="text-xs text-muted-foreground">
                  {b.company} · {b.id}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskColorClass(b.riskLevel)}`}
                >
                  Risk {b.riskScore}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {b.recommendedAction}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{b.aiInsight}</p>
            <Link
              href={`/dashboard/borrowers/${b.id}`}
              className="flex w-fit items-center gap-1.5 text-sm text-primary hover:opacity-80"
            >
              View account
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
