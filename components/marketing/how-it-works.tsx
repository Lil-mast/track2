const steps = [
  {
    number: "01",
    title: "Connect your loan portfolio",
    description:
      "Import loan accounts, repayment histories, and borrower records into a secure Amazon Aurora PostgreSQL data layer.",
  },
  {
    number: "02",
    title: "AI analyzes every account",
    description:
      "The recommendation engine evaluates borrower behavior, repayment patterns, and loan terms to score default risk dynamically.",
  },
  {
    number: "03",
    title: "Receive recovery strategies",
    description:
      "Get context-aware next steps for each account — a restructured payment plan, an automated reminder, or a personal outreach call.",
  },
  {
    number: "04",
    title: "Act and track outcomes",
    description:
      "Execute recommended actions from the dashboard and monitor recovery performance across your entire portfolio.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-card/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            How It Works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Simple process, measurable results
          </h2>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <li
              key={step.number}
              className="flex gap-5 rounded-xl border border-border bg-background p-6"
            >
              <span className="font-mono text-2xl font-semibold text-primary" aria-hidden="true">
                {step.number}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
