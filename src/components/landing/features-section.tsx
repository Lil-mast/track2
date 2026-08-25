import { MessageSquare, Radar, Route } from "lucide-react";

const features = [
  {
    Icon: Route,
    title: "Dynamic Workflows",
    description:
      "Automatically adapt communication channels and messaging templates in response to real-time borrower behavioral cues.",
  },
  {
    Icon: Radar,
    title: "Predictive Risk Scoring",
    description:
      "Leverage advanced heuristics to pre-emptively forecast defaults, targeting accounts before delinquency intensifies.",
  },
  {
    Icon: MessageSquare,
    title: "Sentiment Analysis",
    description:
      "Parse incoming communications to assess borrower intent, seamlessly escalating hot cases to human agents.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-7xl overflow-hidden px-4 py-28 sm:px-6"
    >
      <div className="mb-20 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#5a210f]/15 bg-[#fff8ed]/90 p-8 shadow-[0_20px_50px_rgba(74,24,12,0.1)] backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#42170d]/10 text-sm font-bold text-[#42170d]">
              ✕
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#7f452f]">
              Standard Recovery Model
            </span>
          </div>
          <h3 className="mb-4 text-2xl font-bold tracking-tight text-[#42170d] md:text-3xl">
            Legacy collection cycles are{" "}
            <span className="text-[#b42318]">costly and aggressive.</span>
          </h3>
          <ul className="mb-8 space-y-4">
            {[
              "Aggressive, tone-deaf automated calls irritate borrowers.",
              "Poor data segmentation causes late-stage default oversight.",
              "Inefficient workflows raise operational costs by over 40%.",
              "Harsh tactics permanently damage customer relationships.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-[#7f452f]"
              >
                <span className="mt-0.5 shrink-0 text-lg leading-none text-[#b42318]/80">
                  ○
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="relative mt-6 flex h-28 w-full items-end overflow-hidden rounded-lg border border-[#5a210f]/10 bg-[#42170d]/[0.04] p-4">
            <div className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-wider text-[#7f452f]">
              Average recovery % over 90 days
            </div>
            <svg
              aria-label="Declining recovery trend chart"
              className="h-16 w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,20 L25,45 L50,60 L75,70 L100,90"
                fill="none"
                stroke="#b42318"
                strokeWidth="2.5"
              />
              <circle cx="100" cy="90" fill="#b42318" r="4" />
            </svg>
            <div className="absolute bottom-3 right-4 text-xs font-extrabold text-[#b42318]">
              -62% Repayment Decline
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#5a210f]/20 bg-[#42170d] p-8 text-[#fff8ed] shadow-[0_20px_50px_rgba(74,24,12,0.18)]">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff9b55]/20 text-sm text-[#ffc990]">
              ✓
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#ffc990]">
              RecoveryAI Model
            </span>
          </div>
          <h3 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
            Dynamic, empathetic engagement{" "}
            <span className="text-[#ff9b55]">accelerates success.</span>
          </h3>
          <ul className="mb-8 space-y-4">
            {[
              "Generates high-empathy communications matching borrower sentiment.",
              "Identifies repayment probability peaks using Amazon Nova AI.",
              "Provides flexible payment links over preferred messaging channels.",
              "Maintains a high-retention customer lifecycle post-delinquency.",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-[#f2cfb9]"
              >
                <span className="mt-0.5 shrink-0 text-lg leading-none text-[#ff9b55]">
                  ●
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="relative mt-6 flex h-28 w-full items-end overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-wider text-[#ffc990]">
              Average recovery % over 90 days
            </div>
            <svg
              aria-label="Growing recovery trend chart"
              className="h-16 w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,80 Q25,60 50,30 T100,10"
                fill="none"
                stroke="#ff9b55"
                strokeWidth="2.5"
              />
              <circle cx="100" cy="10" fill="#ff9b55" r="4" />
            </svg>
            <div className="absolute bottom-3 right-4 text-xs font-extrabold text-[#ff9b55]">
              +86% Repayment Growth
            </div>
          </div>
        </div>
      </div>

      <div id="how-it-works" className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-[#fff8ed] md:text-5xl">
          Precision Engineered for Scale
        </h2>
        <p className="text-lg font-medium text-[#5a210f]">
          Ditch manual outreach rules. The RecoveryAI inference engine analyzes
          behavioral variables in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {features.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[1.75rem] border border-[#5a210f]/15 bg-[#fff8ed]/90 p-8 shadow-[0_16px_40px_rgba(74,24,12,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[#5a210f]/30 hover:shadow-[0_20px_50px_rgba(74,24,12,0.14)]"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f36b21]/15 text-[#42170d]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mb-3 text-xl font-bold tracking-tight text-[#42170d]">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-[#7f452f]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
