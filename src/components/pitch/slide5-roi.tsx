import { TrendingUp, DollarSign, Users, Shield, Sparkles, ArrowUpRight } from "lucide-react";

const metrics = [
  {
    value: "20–35%",
    label: "Recovery Rate Improvement",
    sub: "via predictive scoring & personalized outreach",
    color: "emerald",
    icon: TrendingUp,
  },
  {
    value: "~40%",
    label: "Agent Cost Reduction",
    sub: "through automation of routine collection tasks",
    color: "blue",
    icon: DollarSign,
  },
  {
    value: "↑ CLV",
    label: "Customer Lifetime Value",
    sub: "empathetic remediation reduces churn vs. aggressive tactics",
    color: "purple",
    icon: Users,
  },
  {
    value: "100%",
    label: "Audit-Ready Compliance",
    sub: "every AI decision logged with full explainability trail",
    color: "amber",
    icon: Shield,
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; valueBg: string }> = {
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-300", valueBg: "text-gradient-green" },
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-500/10",    text: "text-blue-300",    valueBg: "text-gradient-cyan" },
  purple:  { border: "border-purple-500/30",  bg: "bg-purple-500/10",  text: "text-purple-300",  valueBg: "text-gradient-cyan" },
  amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/10",   text: "text-amber-300",   valueBg: "text-gradient-cyan" },
};

const approachItems = [
  { label: "Predictive Analytics", detail: "ML delinquency scores on transaction & bureau data" },
  { label: "NLP Conversational Agents", detail: "Empathetic AI messaging adapted to borrower context" },
  { label: "Omnichannel Orchestration", detail: "Email, SMS, in-app — unified outreach routing" },
  { label: "Open Banking Data", detail: "Alternative data for early distress detection" },
  { label: "Micro-Restructuring", detail: "Flexible rescheduling instead of aggressive escalation" },
];

export function Slide5Roi() {
  return (
    <div className="flex flex-col gap-8 min-h-[75vh] justify-center px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mt-1">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-1">Outcomes & ROI</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-balance leading-tight text-gradient-green">
            Measurable Business Impact
          </h2>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ value, label, sub, color, icon: Icon }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`framer-glass framer-glass-hover rounded-2xl p-5 border ${c.border} flex flex-col gap-3`}>
              <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <p className={`text-3xl font-extrabold ${c.valueBg}`}>{value}</p>
              <div>
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column: approach + quote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Modern approach */}
        <div className="framer-glass rounded-2xl p-6 flex flex-col gap-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Modern Recovery Approach</p>
          <ul className="space-y-3">
            {approachItems.map(({ label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <ArrowUpRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Key insight + CTA */}
        <div className="flex flex-col gap-4">
          <div className="framer-glass rounded-2xl p-6 border border-primary/20 flex-1 flex flex-col justify-between gap-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <blockquote className="text-base sm:text-lg font-medium text-foreground/90 leading-relaxed text-balance italic">
              &ldquo;Improving collection outcomes while preserving customer lifetime value is now a competitive requirement for fintech lenders — AI-powered recovery platforms both increase recoveries and reduce churn by treating repayment as a customer service problem, not only enforcement.&rdquo;
            </blockquote>
            <div className="text-xs text-muted-foreground">Industry Research · 2025</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/30 p-5 flex flex-col gap-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Bottom Line</p>
            <p className="text-sm text-foreground/90 font-medium">
              Direct revenue lift through higher recovery rates + margin improvement through agent cost automation — all while improving borrower relationships and satisfying regulators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
