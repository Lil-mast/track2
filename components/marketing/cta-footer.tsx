import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function Cta() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center md:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]"
          />
          <h2 className="relative text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Make recovery proactive, not reactive
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Connect your loan portfolio and start receiving AI-assisted recovery
            recommendations for every account.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              View Live Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight">RecoveryAI</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            AI-Assisted Smart Loan Recovery Platform for financial institutions and
            lending companies.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-12 gap-y-6" aria-label="Footer navigation">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Product
            </p>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How It Works
            </Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Platform
            </p>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground">
              Get Started
            </Link>
          </div>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border px-4 pt-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          Created for the H0: Hack the Zero Stack Hackathon — 2026. Track 2: Monetizable B2B App.
        </p>
      </div>
    </footer>
  );
}
