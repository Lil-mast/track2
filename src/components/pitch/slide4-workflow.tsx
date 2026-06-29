import {
  FileText,
  Scale,
  Bot,
  Shield,
  CheckCircle2,
  ScrollText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    step: 1,
    icon: FileText,
    title: "Input Data",
    color: "blue",
    desc: "Transaction history, payment records, contact history, and outstanding balances ingested from Aurora PostgreSQL.",
    tag: "Data Ingestion",
  },
  {
    step: 2,
    icon: Scale,
    title: "Risk Scoring",
    color: "purple",
    desc: "Composite risk score (0–100) computed via ML model across days overdue, missed payments, on-time rate, and open-banking signals.",
    tag: "ML Engine",
  },
  {
    step: 3,
    icon: Bot,
    title: "AI Recommendation",
    color: "cyan",
    desc: "AWS Bedrock generates a context-aware, empathetic action — from payment reminder to micro-restructuring — with reasoning and next steps.",
    tag: "Bedrock AI",
  },
  {
    step: 4,
    icon: Shield,
    title: "Rule Validation",
    color: "amber",
    desc: "Lender-defined business rules are checked. Auto-execute eligible actions are flagged; others require manual approval with full justification.",
    tag: "Compliance",
  },
  {
    step: 5,
    icon: CheckCircle2,
    title: "Final Action",
    color: "emerald",
    desc: "Approved action is dispatched — email, SMS, restructure offer, or legal escalation — with auto-execution eligibility clearly indicated.",
    tag: "Execution",
  },
  {
    step: 6,
    icon: ScrollText,
    title: "Audit Log",
    color: "rose",
    desc: "Every decision — input data, AI reasoning, rule outcomes, and final action — is immutably logged with a unique workflow ID for regulator access.",
    tag: "Audit Trail",
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; connector: string }> = {
  blue:    { border: "border-blue-500/40",    bg: "bg-blue-500/15",    text: "text-blue-300",    connector: "bg-blue-500/30" },
  purple:  { border: "border-purple-500/40",  bg: "bg-purple-500/15",  text: "text-purple-300",  connector: "bg-purple-500/30" },
  cyan:    { border: "border-cyan-500/40",     bg: "bg-cyan-500/15",    text: "text-cyan-300",    connector: "bg-cyan-500/30" },
  amber:   { border: "border-amber-500/40",   bg: "bg-amber-500/15",   text: "text-amber-300",   connector: "bg-amber-500/30" },
  emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/15", text: "text-emerald-300", connector: "bg-emerald-500/30" },
  rose:    { border: "border-rose-500/40",    bg: "bg-rose-500/15",    text: "text-rose-300",    connector: "bg-rose-500/30" },
};

export function Slide4Workflow() {
  return (
    <div className="flex flex-col gap-8 min-h-[75vh] justify-center px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mt-1">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">App Workflow</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-balance leading-tight text-gradient-cyan">
            6-Step AI Recovery Engine
          </h2>
        </div>
      </div>

      {/* Pipeline arrow overview */}
      <div className="hidden lg:flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const c = colorMap[s.color];
          return (
            <div key={s.step} className="flex items-center gap-1 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.border} ${c.bg}`}>
                <s.icon className={`w-3 h-3 ${c.text}`} />
                <span className={`text-xs font-semibold ${c.text}`}>{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map(({ step, icon: Icon, title, color, desc, tag }) => {
          const c = colorMap[color];
          return (
            <div
              key={step}
              className={`framer-glass framer-glass-hover rounded-2xl p-5 border ${c.border} flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <span className="text-xs font-mono text-muted-foreground/60">Step {step}</span>
              </div>
              <div>
                <p className={`font-bold text-sm ${c.text} mb-0.5`}>{tag}</p>
                <p className="font-semibold text-foreground">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom callout */}
      <div className="framer-glass rounded-xl p-4 flex items-center gap-3 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-foreground/80">
          Every workflow run generates an immutable{" "}
          <span className="font-semibold text-foreground">Audit Log</span> with workflow ID, AI reasoning, rule outcomes, and final action — fully accessible from the{" "}
          <span className="text-primary font-medium">Audit Logs dashboard</span>.
        </p>
      </div>
    </div>
  );
}
