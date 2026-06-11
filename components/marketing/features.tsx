import { Gauge, MessagesSquare, FileText, Bot, BellRing, Database } from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Dynamic Risk Scoring",
    description:
      "Continuous assessment of default probability based on borrower behavior, repayment history, and loan terms — not static overdue flags.",
  },
  {
    icon: FileText,
    title: "Strategy Generation",
    description:
      "Automated drafting of customized recovery plans, from restructured payment schedules to escalation paths.",
  },
  {
    icon: Bot,
    title: "Context-Aware Recommendations",
    description:
      "Generative AI turns live borrower data into actionable insights instead of rigid, rule-based triggers.",
  },
  {
    icon: BellRing,
    title: "Automated Reminders",
    description:
      "Schedule proactive payment reminders before accounts become delinquent, reducing the need for collections.",
  },
  {
    icon: MessagesSquare,
    title: "Sentiment Analysis",
    description:
      "Planned: analyze communication history to tailor outreach tone and timing for each borrower.",
    badge: "Roadmap",
  },
  {
    icon: Database,
    title: "Enterprise Data Layer",
    description:
      "Relational data integrity on Amazon Aurora PostgreSQL with enterprise-grade performance and scaling.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to recover with confidence
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Traditional loan recovery is reactive and abrasive. RecoveryAI transforms it
            into a proactive, data-driven experience.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                {feature.badge && (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {feature.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
