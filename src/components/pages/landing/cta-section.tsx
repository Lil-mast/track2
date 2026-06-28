export function CtaSection() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-28 overflow-hidden z-10">
      {/* Dynamic ambient background matching Framer templates */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 blur-[60px] pointer-events-none -z-10" />

      <div className="rounded-3xl border border-white/[0.08] bg-[#0c101d]/40 backdrop-blur-md p-12 md:p-20 text-center relative overflow-hidden group">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-[80px] pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-700" />

        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Transform Loan Recovery <br />
            <span className="text-gradient-cyan">With AI Intelligence.</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
            Join the forward-thinking fintech lenders utilizing RecoveryAI to turn delinquencies into retention channels.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/30 hover:scale-[1.03] transition-all duration-300">
              Start Building Now
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
            
            <button className="px-8 py-4 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all font-semibold">
              Contact Sales Teams
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
