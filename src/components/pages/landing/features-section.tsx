import React from "react";

const features = [
  {
    icon: "route",
    title: "Dynamic Workflows",
    description: "Automatically adapt communication channels and messaging templates in response to real-time borrower behavioral cues.",
    glow: "group-hover:border-blue-500/30 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    iconBg: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: "radar",
    title: "Predictive Risk Scoring",
    description: "Leverage advanced heuristics to pre-emptively forecast defaults, targeting accounts before delinquency intensifies.",
    glow: "group-hover:border-indigo-500/30 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
    iconBg: "text-indigo-400 bg-indigo-500/10",
  },
  {
    icon: "forum",
    title: "Sentiment Analysis",
    description: "Parse incoming communications to assess borrower intent, seamlessly escalating hot cases to human agents.",
    glow: "group-hover:border-cyan-500/30 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    iconBg: "text-cyan-400 bg-cyan-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-28 overflow-hidden">
      {/* Before vs After Side-by-side Bento Panel Grid (Observed in reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
        
        {/* Left Side: Before (Delinquency Problems) */}
        <div className="rounded-2xl border border-rose-500/10 bg-rose-950/5 p-8 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
              ✕
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
              Standard Recovery Model
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">
            Legacy collection cycles are <span className="text-gradient-red">costly and aggressive.</span>
          </h3>

          <ul className="space-y-4 mb-8">
            {[
              "Aggressive, tone-deaf automated calls irritate borrowers.",
              "Poor data segmentation causes late-stage default oversight.",
              "Inefficient workflows raise operational costs by over 40%.",
              "Harsh tactics permanently damage customer relationships."
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="material-symbols-outlined text-rose-500/80 text-lg shrink-0 mt-0.5">
                  remove_circle_outline
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Red line chart illustration */}
          <div className="h-28 w-full border-t border-rose-500/10 mt-6 relative overflow-hidden bg-rose-500/[0.02] rounded-lg p-4 flex items-end">
            <div className="absolute top-3 left-4 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
              Average recovery percentage over 90 days
            </div>
            <svg className="w-full h-16" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,20 L25,45 L50,60 L75,70 L100,90" fill="none" stroke="#ef4444" strokeWidth="2.5"></path>
              <circle cx="100" cy="90" r="4" fill="#ef4444"></circle>
            </svg>
            <div className="absolute bottom-3 right-4 text-xs font-extrabold text-rose-400">
              -62% Repayment Decline
            </div>
          </div>
        </div>

        {/* Right Side: After (Solution with RecoveryAI) */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/5 p-8 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              ✓
            </span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              RecoveryAI Model
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-4">
            Dynamic, empathetic engagement <span className="text-gradient-green">accelerates success.</span>
          </h3>

          <ul className="space-y-4 mb-8">
            {[
              "Generates high-empathy communications matching borrower sentiment.",
              "Identifies repayment probability peaks using Amazon Nova AI.",
              "Provides flexible payment links over preferred messaging channels.",
              "Maintains a high-retention customer lifecycle post-delinquency."
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="material-symbols-outlined text-emerald-400 text-lg shrink-0 mt-0.5">
                  check_circle
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Green/Blue line chart illustration */}
          <div className="h-28 w-full border-t border-blue-500/10 mt-6 relative overflow-hidden bg-blue-500/[0.02] rounded-lg p-4 flex items-end">
            <div className="absolute top-3 left-4 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Average recovery percentage over 90 days
            </div>
            <svg className="w-full h-16" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,80 Q25,60 50,30 T100,10" fill="none" stroke="#10b981" strokeWidth="2.5"></path>
              <circle cx="100" cy="10" r="4" fill="#10b981"></circle>
            </svg>
            <div className="absolute bottom-3 right-4 text-xs font-extrabold text-emerald-400">
              +86% Repayment Growth
            </div>
          </div>
        </div>
      </div>

      {/* Grid Headers */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Precision Engineered for Scale
        </h2>
        <p className="text-slate-400 text-lg font-medium">
          Ditch manual outreach rules. The RecoveryAI inference engine analyzes behavioral variables in real-time.
        </p>
      </div>

      {/* 3-Column Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`border border-white/[0.08] bg-[#0c101d]/30 backdrop-blur-sm p-8 rounded-2xl transition-all duration-300 group ${feature.glow}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 font-bold ${feature.iconBg}`}>
              <span className="material-symbols-outlined">
                {feature.icon}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-3">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
