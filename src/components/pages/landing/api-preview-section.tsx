const samplePayload = `{
  "borrower_id": "usr_98a7f6",
  "status": "delinquent_15d",
  "ai_recommendation": {
    "action": "pause_automated_calls",
    "alternative": "send_personalized_email",
    "tone": "empathetic_flexible",
    "probability_of_success": 0.86,
    "reasoning": "Borrower historically responds poorly to phone calls but engages with email offers containing flexible payment links."
  }
}`;

export function ApiPreviewSection() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-28 border-t border-white/[0.05]">
      {/* Decorative ambient glowing orb */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-cyan-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="rounded-2xl border border-white/[0.08] bg-[#0b0f19]/40 backdrop-blur-md overflow-hidden flex flex-col md:flex-row relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Left Side: Copy */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-wider uppercase mb-6 border border-cyan-500/20 max-w-max">
            <span className="material-symbols-outlined text-sm">integration_instructions</span>
            Developer-First SDK
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            See Into The Engine
          </h2>
          
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Under the hood, our inference engine processes vast amounts of behavioral variables to output structured, clean, and highly actionable JSON payloads directly into your API routers.
          </p>

          <a
            className="group inline-flex items-center gap-1.5 text-blue-400 font-bold hover:text-cyan-400 transition-colors"
            href="#"
          >
            View SDK Documentation 
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
              open_in_new
            </span>
          </a>
        </div>

        {/* Right Side: Visual JSON Terminal Code Block */}
        <div className="w-full md:w-1/2 bg-black/60 p-8 border-t md:border-t-0 md:border-l border-white/[0.08] font-mono text-sm relative z-10 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="w-3 h-3 rounded-full bg-white/10" />
              <span className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">payload.json</span>
          </div>

          <pre className="text-slate-300 overflow-x-auto bg-slate-950/40 p-4 rounded-lg border border-white/[0.04]">
            <code className="language-json">{samplePayload}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
