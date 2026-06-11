import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$199",
    period: "/month",
    description: "For small lending teams getting started with AI-assisted recovery.",
    cta: "Start Free Trial",
    href: "/signup",
    featured: false,
    features: [
      "Up to 1,000 active loan accounts",
      "Dynamic risk scoring",
      "AI recovery recommendations",
      "Automated payment reminders",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$599",
    period: "/month",
    description: "For lending companies scaling their recovery operations.",
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
    features: [
      "Up to 25,000 active loan accounts",
      "Everything in Starter",
      "Strategy generation & restructuring plans",
      "Portfolio analytics dashboard",
      "Team roles & permissions",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For banks and financial institutions with complex portfolios.",
    cta: "Contact Sales",
    href: "/signup",
    featured: false,
    features: [
      "Unlimited loan accounts",
      "Everything in Growth",
      "Dedicated Aurora PostgreSQL cluster",
      "SSO via AWS Cognito",
      "Custom AI model configuration",
      "Dedicated account manager",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Plans that scale with your portfolio
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Transparent B2B pricing. Every plan includes the AI recommendation engine.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-xl border p-6 ${
                plan.featured
                  ? "border-primary/50 bg-card shadow-lg shadow-primary/5"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                {plan.featured && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <Link
                href={plan.href}
                className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                  plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
