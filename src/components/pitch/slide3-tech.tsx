import { Cpu, Layers, Zap, Database, Shield, Code2 } from "lucide-react";

const techPillars = [
  {
    icon: Code2,
    color: "blue",
    name: "v0 by Vercel",
    role: "UI Generation & Prototyping",
    bullets: [
      "Full design system generated with v0",
      "Rapid iteration from prompt to production-quality code",
      "RecoveryAI dark fintech UI scaffold built in hours, not weeks",
      "Consistent component library across all 10+ dashboard pages",
    ],
  },
  {
    icon: Layers,
    color: "orange",
    name: "Amazon Web Services",
    role: "Cloud Infrastructure",
    bullets: [
      "Convex for transactional loan data",
      "Scalable, managed infrastructure with 99.99% SLA",
      "IAM-based secure access patterns with zero hardcoded credentials",
      "Multi-AZ deployment for high availability and disaster recovery",
    ],
  },
  {
    icon: Cpu,
    color: "emerald",
    name: "AWS Bedrock AI",
    role: "Intelligence Layer",
    bullets: [
      "Generative AI powering the 6-step recovery engine workflow",
      "Contextual reasoning for borrower-specific action recommendations",
      "Risk scoring via ML models on payment, bureau & alternative data",
      "NLP-driven personalized outreach and empathetic messaging",
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; icon: string; dot: string }> = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: "text-blue-400",
    dot: "bg-blue-400",
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    icon: "text-orange-400",
    dot: "bg-orange-400",
  },
  emerald: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

export function Slide3Tech() {
  return (
    <div className="flex flex-col gap-8 min-h-[75vh] justify-center px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mt-1">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">Technology</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-balance leading-tight text-gradient-cyan">
            Built on World-Class Infrastructure
          </h2>
        </div>
      </div>

      {/* Tech pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {techPillars.map(({ icon: Icon, color, name, role, bullets }) => {
          const c = colorMap[color];
          return (
            <div
              key={name}
              className={`framer-glass rounded-2xl p-6 flex flex-col gap-4 border ${c.border}`}
            >
              {/* Icon + name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">{name}</p>
                  <p className={`text-xs font-medium ${c.icon}`}>{role}</p>
                </div>
              </div>
              {/* Bullets */}
              <ul className="space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Additional building blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Database, label: "Feature Store", sub: "Borrower signal pipelines" },
          { icon: Shield, label: "Compliance Logging", sub: "Full audit trail per decision" },
          { icon: Layers, label: "Orchestration Layer", sub: "Campaign & agent routing" },
          { icon: Cpu, label: "ML Delinquency Models", sub: "Early-distress detection" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="framer-glass rounded-xl p-4 flex flex-col gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
