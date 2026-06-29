export function Slide1Cover() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[75vh] gap-8 px-4">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Team ApexMaths · RecoveryAI
      </div>

      {/* Main title */}
      <div className="space-y-4">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-none tracking-tight text-balance">
          <span className="text-gradient-cyan">RecoveryAI</span>
        </h1>
        <p className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/70 text-balance max-w-3xl mx-auto">
          AI-Powered Loan Recovery for the Next Generation of Fintech Lenders
        </p>
      </div>

      {/* Divider line with glow */}
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-2">
        {[
          { value: "35%", label: "Recovery Rate Lift" },
          { value: "6", label: "AI Workflow Steps" },
          { value: "24/7", label: "Automated Outreach" },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-gradient-cyan">{value}</span>
            <span className="text-xs sm:text-sm text-muted-foreground text-balance">{label}</span>
          </div>
        ))}
      </div>

      {/* Tech stack pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {["Next.js 16", "v0 by Vercel", "AWS Bedrock", "Amazon Aurora", "TypeScript"].map((tech) => (
          <span
            key={tech}
            className="framer-glass px-3 py-1.5 rounded-full text-xs font-medium text-foreground/80"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Bottom note */}
      <p className="text-xs text-muted-foreground/60 mt-4">
        Hackathon Presentation · June 2026
      </p>
    </div>
  );
}
