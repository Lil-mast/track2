import { AlertTriangle, TrendingDown, Users, ShieldX, DollarSign, Clock } from "lucide-react";

const pains = [
  {
    icon: DollarSign,
    title: "High Operational Costs",
    desc: "Manual outreach, agent salaries, and paper-based processes drain margins with minimal returns.",
  },
  {
    icon: TrendingDown,
    title: "Low Recovery Rates",
    desc: "Without predictive scoring, lenders pursue all accounts equally — missing high-value opportunities.",
  },
  {
    icon: ShieldX,
    title: "Regulatory Friction",
    desc: "Lack of explainability and audit trails exposes lenders to compliance violations and reputational risk.",
  },
  {
    icon: Users,
    title: "Damaged Customer Trust",
    desc: "Aggressive, generic collection tactics reduce customer lifetime value and increase churn.",
  },
];

export function Slide2Problem() {
  return (
    <div className="flex flex-col gap-8 min-h-[75vh] justify-center px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mt-1">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-red-400 tracking-widest uppercase mb-1">The Problem</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-balance leading-tight text-gradient-red">
            Loan Recovery is Broken
          </h2>
        </div>
      </div>

      {/* Problem statement */}
      <div className="framer-glass rounded-2xl p-6 max-w-4xl">
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed text-balance">
          Lenders and digital-credit providers <span className="text-foreground font-semibold">lack an integrated, data-driven recovery platform</span> that combines early-risk detection, personalized borrower engagement, and audit-ready automation — leading to high costs, lower recovery rates, regulatory friction, and damaged customer relationships.
        </p>
      </div>

      {/* Pain points grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pains.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="framer-glass framer-glass-hover rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-red-400" />
            </div>
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Why it matters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Competitive Pressure</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            AI-powered fintechs already reduce collection costs and improve recovery rates by <span className="font-bold text-foreground">25–35%</span> through predictive scoring and personalized outreach.
          </p>
        </div>
        <div className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldX className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Regulatory Imperative</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Explainability and compliance-first design are now essential. Regulators require audit trails and transparent AI decision-making across recovery workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
