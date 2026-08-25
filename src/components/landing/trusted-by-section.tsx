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
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mb-20 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {stats.map(({ value, label }) => (
          <div
            key={label}
            className="rounded-[1.35rem] border border-[#5a210f]/15 bg-[#fff8ed]/85 p-6 text-center shadow-[0_16px_40px_rgba(74,24,12,0.08)] backdrop-blur-sm"
          >
            <div className="mb-2 text-3xl font-extrabold tracking-tight text-[#42170d]">
              {value}
            </div>
            <div className="text-xs font-medium leading-snug text-[#7f452f]">
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#5a210f]/70">
          Trusted by leading B2B lenders
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {trustedLogos.map((name) => (
          <div
            key={name}
            className="rounded-xl border border-[#5a210f]/12 bg-[#fff8ed]/70 px-5 py-3 text-sm font-semibold text-[#7f452f] backdrop-blur-sm transition-colors hover:border-[#5a210f]/25 hover:text-[#42170d]"
          >
            {name}
          </div>
        ))}
      </div>
    </section>
  );
}
