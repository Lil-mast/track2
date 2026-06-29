const stats = [
  { value: "$2.4B+", label: "Recovery Volume Processed" },
  { value: "94.7%", label: "Average Recovery Rate" },
  { value: "120+", label: "Enterprise Lenders" },
  { value: "3.2×", label: "Faster Than Legacy Systems" },
];

const trustedLogos = [
  "Meridian Capital",
  "Apex Funding",
  "NovaBridge Finance",
  "Pacific Credit",
  "Harbor Lending",
  "Summit Capital",
];

export function TrustedBySection() {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
        {stats.map(({ value, label }) => (
          <div
            key={label}
            className="text-center border border-white/[0.06] rounded-2xl bg-[#0c101d]/30 p-6"
          >
            <div className="text-3xl font-extrabold text-white mb-2">
              {value}
            </div>
            <div className="text-xs text-slate-400 font-medium leading-snug">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Trusted by */}
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Trusted by leading B2B lenders
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {trustedLogos.map((name) => (
          <div
            key={name}
            className="px-5 py-3 rounded-xl border border-white/[0.06] bg-[#0c101d]/30 text-slate-500 text-sm font-semibold hover:text-slate-300 hover:border-white/[0.12] transition-colors"
          >
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}
