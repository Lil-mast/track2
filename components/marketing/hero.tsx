import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Subtle radial glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center md:px-6">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          B2B SaaS for financial institutions and lenders
        </p>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Loan recovery guided by intelligence
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          RecoveryAI analyzes borrower behavior, repayment history, and loan terms to
          recommend the most effective next step — a restructured payment plan, an
          automated reminder, or a personal outreach call.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            View Live Demo
          </Link>
        </div>

        {/* Product preview card */}
        <div className="mt-16 w-full max-w-4xl rounded-xl border border-border bg-card p-2 shadow-2xl">
          <div className="rounded-lg border border-border/60 bg-background p-4 md:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                Recovery Dashboard
              </div>
              <span className="font-mono text-xs text-muted-foreground">Live portfolio</span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="size-3.5 text-primary" aria-hidden="true" />
                  Recovery Rate
                </span>
                <span className="text-2xl font-semibold tabular-nums">68.4%</span>
                <span className="text-xs text-primary">+5.2% this quarter</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
                  High-Risk Accounts
                </span>
                <span className="text-2xl font-semibold tabular-nums">142</span>
                <span className="text-xs text-muted-foreground">of 2,318 active loans</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-left">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                  AI Actions Pending
                </span>
                <span className="text-2xl font-semibold tabular-nums">37</span>
                <span className="text-xs text-muted-foreground">recommendations to review</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                AI Recommendation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                &quot;This borrower has missed two payments on a high-interest loan that is
                80% through its term. Recommend a restructuring call before escalating to
                collections.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
