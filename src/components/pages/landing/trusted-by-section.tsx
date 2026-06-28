export function TrustedBySection() {
  const logos = ["AcmeCorp", "GlobalFin", "NexBank", "Stellar"];

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-10 border-y border-white/[0.05] mt-10 z-10 overflow-hidden">
      <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
        Trusted by high-growth industry leaders
      </div>
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30">
        {logos.map((logo) => (
          <div
            key={logo}
            className="text-lg md:text-xl font-extrabold text-white tracking-widest hover:opacity-100 hover:scale-105 transition-all duration-300 cursor-default"
          >
            {logo.toUpperCase()}
          </div>
        ))}
      </div>
    </section>
  );
}
