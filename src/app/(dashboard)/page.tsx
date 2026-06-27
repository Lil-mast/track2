import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
  Zap,
} from "lucide-react";

const workflow = [
  {
    title: "Ingest portfolio signals",
    description:
      "Loan status, payment behavior, borrower profile, collateral, and contact history are normalized for every account.",
    icon: Network,
  },
  {
    title: "Score delinquency risk",
    description:
      "RecoveryAI weighs days overdue, missed payments, sector context, response history, and exposure concentration.",
    icon: BarChart3,
  },
  {
    title: "Generate next action",
    description:
      "AI recommends the right path: reminder, call, payment plan, hardship review, legal notice, or collections referral.",
    icon: Bot,
  },
  {
    title: "Validate lender rules",
    description:
      "Recommendations pass through policy thresholds, approval controls, automation rules, and compliance logging.",
    icon: FileCheck2,
  },
];

const features = [
  "Priority queues for overdue commercial accounts",
  "AI reasoning with confidence and expected recovery",
  "Policy-aware approval and execution controls",
  "Audit-ready recovery trail for every recommendation",
  "Borrower-specific scripts and next-best actions",
  "Portfolio risk views across active, overdue, and defaulted loans",
];

const metrics = [
  ["92%", "top recommendation confidence"],
  ["6", "recovery actions supported"],
  ["130+", "days overdue escalations"],
  ["24/7", "portfolio monitoring"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(37,99,235,0.38),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.2),transparent_28%),linear-gradient(180deg,#05070d_0%,#08111f_48%,#f7fbff_48%,#ffffff_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl">
            <Sparkles className="h-5 w-5 text-sky-200" />
          </span>
          <span className="text-lg font-semibold tracking-tight">RecoveryAI</span>
        </Link>
        <nav className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 text-sm text-white/72 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl md:flex">
          {["Workflow", "Platform", "Security", "Results"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-full px-4 py-2 transition hover:bg-white/12 hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>
        <Link
          href="/recovery"
          className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-950/30 backdrop-blur-xl transition hover:bg-sky-400/25"
        >
          Open app
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-sky-100 shadow-xl shadow-blue-950/20 backdrop-blur-xl">
            <Zap className="h-4 w-4 text-sky-300" />
            AI recovery intelligence for B2B lenders
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
            Recover overdue loans with sharper AI decisions.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            RecoveryAI turns delinquency signals into lender-approved recovery
            recommendations, scripts, approvals, and audit trails without
            exposing teams to manual portfolio guesswork.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/recovery"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#07111f] shadow-2xl shadow-blue-950/35 transition hover:bg-sky-50"
            >
              View recovery flow
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/loans"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/14"
            >
              Explore loan signals
            </Link>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["Amazon Nova", "Rule checks", "Audit logs"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-slate-200 shadow-lg shadow-blue-950/20 backdrop-blur-xl"
              >
                <CheckCircle2 className="mb-2 h-4 w-4 text-sky-300" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl">
          <div className="absolute -inset-6 rounded-[2rem] bg-sky-400/20 blur-3xl" />
          <div className="glass-drift relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/12 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="glass-shine absolute inset-y-0 left-0" />
            <div className="relative rounded-[1.55rem] border border-white/12 bg-[#07101e]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm text-slate-400">Live recommendation</p>
                  <p className="mt-1 text-xl font-semibold">Pacific Builders Inc.</p>
                </div>
                <span className="rounded-full border border-red-300/25 bg-red-400/12 px-3 py-1 text-xs font-medium text-red-100">
                  Critical risk
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["$780K", "outstanding"],
                  ["130", "days overdue"],
                  ["92%", "confidence"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                  >
                    <p className="text-2xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300 text-[#06101d]">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Issue formal demand letter</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Persistent non-payment, high exposure, and exhausted
                      outreach attempts trigger legal notice before collections.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Input signals", "Loan, payment, borrower, contact history"],
                  ["Risk scoring", "Critical exposure and missed-payment pattern"],
                  ["Rule validation", "Manual approval required before execution"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3"
                    style={{ animation: `floatIn 700ms ${index * 110}ms both` }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#07111f]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="truncate text-xs text-slate-400">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="relative z-10 bg-white px-5 py-20 text-[#07111f] sm:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                Workflow
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal sm:text-5xl">
                From delinquency signals to auditable recovery action.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              The landing page mirrors the product workflow without rendering the
              dashboard: intake, intelligence, recommendation, policy check, and
              audit trail.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_80px_rgba(37,99,235,0.16)]"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07111f] text-white transition group-hover:bg-blue-600">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="relative z-10 overflow-hidden bg-[#07111f] px-5 py-20 text-white sm:px-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
              Platform
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
              A liquid-glass command layer for recovery teams.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              RecoveryAI helps lenders decide which accounts need attention,
              which action is justified, and which actions can move forward
              under policy.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/12 bg-white/8 p-4 text-sm text-slate-200 shadow-xl shadow-black/10 backdrop-blur-xl"
                >
                  <CheckCircle2 className="mb-3 h-5 w-5 text-sky-300" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/16 bg-white/10 p-4 shadow-[0_32px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="rounded-[1.5rem] bg-white p-4 text-[#07111f]">
              <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Recovery pipeline</p>
                    <Workflow className="h-5 w-5 text-sky-300" />
                  </div>
                  <div className="mt-7 space-y-4">
                    {[
                      ["Payment plan", "Apex Logistics", "87%"],
                      ["Hardship review", "NovaBio Health", "79%"],
                      ["Priority call", "Stonebridge Mfg", "84%"],
                    ].map(([action, borrower, confidence]) => (
                      <div
                        key={borrower}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{action}</p>
                            <p className="text-sm text-slate-400">{borrower}</p>
                          </div>
                          <span className="rounded-full bg-sky-300 px-3 py-1 text-xs font-semibold text-slate-950">
                            {confidence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <CircleDollarSign className="h-6 w-6 text-blue-600" />
                    <p className="mt-8 text-3xl font-semibold">$624K</p>
                    <p className="mt-1 text-sm text-slate-600">
                      expected recovery
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#07111f] p-5 text-white">
                    <TimerReset className="h-6 w-6 text-sky-300" />
                    <p className="mt-8 text-3xl font-semibold">15 days</p>
                    <p className="mt-1 text-sm text-slate-400">
                      demand window
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="security"
        className="relative z-10 bg-slate-50 px-5 py-20 text-[#07111f] sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Security
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal">
              Built for controlled recovery operations.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:col-span-2">
            {[
              [ShieldCheck, "Policy guardrails", "Every AI recommendation is checked against lender-specific thresholds and manual approval rules."],
              [LockKeyhole, "Compliance trail", "Workflow IDs, audit IDs, timestamps, reviewer decisions, and executions are preserved for review."],
              [Sparkles, "Explainable AI", "Teams see the reason, risk factors, borrower context, and expected recovery behind each action."],
            ].map(([Icon, title, description]) => (
              <div
                key={title as string}
                className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.07)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-8 font-semibold">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="results"
        className="relative z-10 bg-white px-5 py-20 text-[#07111f] sm:px-8"
      >
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#07111f] p-6 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                Results
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                Display-ready fintech story for RecoveryAI.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                The page presents the app as a premium recovery intelligence
                layer while keeping dashboard implementation out of scope.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-xl"
                >
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-400">
              RecoveryAI for commercial lenders, collections teams, and portfolio
              risk leaders.
            </p>
            <Link
              href="/recovery"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-300 px-6 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-white"
            >
              Enter RecoveryAI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes floatIn {
              from { opacity: 0; transform: translateY(14px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes glassDrift {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes glassShine {
              from { transform: translateX(-120%) rotate(12deg); }
              to { transform: translateX(180%) rotate(12deg); }
            }
            @media (prefers-reduced-motion: no-preference) {
              header { animation: floatIn 520ms ease both; }
              .glass-drift { animation: glassDrift 8s ease-in-out infinite; }
              .glass-shine { width: 42%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: glassShine 7s ease-in-out infinite; }
              section:first-of-type h1 { animation: floatIn 760ms 80ms both; }
              section:first-of-type p { animation: floatIn 760ms 150ms both; }
            }
          `,
        }}
      />
    </main>
  );
}
