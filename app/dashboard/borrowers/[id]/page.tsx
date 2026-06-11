import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Percent,
  Banknote,
  AlertTriangle,
  BellRing,
  PhoneCall,
} from "lucide-react";
import { borrowers, formatCurrency, riskColorClass } from "@/lib/data";

export function generateStaticParams() {
  return borrowers.map((b) => ({ id: b.id }));
}

export default async function BorrowerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const borrower = borrowers.find((b) => b.id === id);

  if (!borrower) notFound();

  const facts = [
    {
      icon: Banknote,
      label: "Loan Amount",
      value: formatCurrency(borrower.loanAmount),
    },
    {
      icon: Banknote,
      label: "Outstanding Balance",
      value: formatCurrency(borrower.outstanding),
    },
    {
      icon: Percent,
      label: "Interest Rate",
      value: `${borrower.interestRate}%`,
    },
    {
      icon: AlertTriangle,
      label: "Missed Payments",
      value: String(borrower.missedPayments),
    },
    {
      icon: Calendar,
      label: "Last Payment",
      value: borrower.lastPayment,
    },
    {
      icon: Calendar,
      label: "Next Due Date",
      value: borrower.nextDue,
    },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/dashboard/borrowers"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to borrowers
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs text-muted-foreground">{borrower.id}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{borrower.name}</h1>
          <p className="text-sm text-muted-foreground">{borrower.company}</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${riskColorClass(borrower.riskLevel)}`}
        >
          Risk score: {borrower.riskScore} / 100
        </span>
      </header>

      {/* AI recommendation */}
      <section
        aria-label="AI recommendation"
        className="rounded-xl border border-primary/30 bg-primary/5 p-6"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-primary">AI Recommendation</h2>
          <span className="ml-auto rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {borrower.recommendedAction}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed">{borrower.aiInsight}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PhoneCall className="size-3.5" aria-hidden="true" />
            Schedule Outreach
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
          >
            <BellRing className="size-3.5" aria-hidden="true" />
            Send Reminder
          </button>
        </div>
      </section>

      {/* Loan facts */}
      <section aria-label="Loan details" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <fact.icon className="size-4 text-primary" aria-hidden="true" />
              {fact.label}
            </span>
            <span className="text-lg font-semibold tabular-nums">{fact.value}</span>
          </div>
        ))}
      </section>

      {/* Term progress */}
      <section aria-label="Loan term progress" className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Loan Term Progress</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {borrower.termProgress}% complete
          </span>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={borrower.termProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loan term progress"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${borrower.termProgress}%` }}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {formatCurrency(borrower.loanAmount - borrower.outstanding)} repaid of{" "}
          {formatCurrency(borrower.loanAmount)} principal.
        </p>
      </section>
    </div>
  );
}
