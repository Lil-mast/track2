import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[820px] overflow-hidden pt-32 text-[#fff8ed] sm:min-h-[900px] sm:pt-40">
      <div className="relative z-10 mx-auto flex w-full max-w-[1424px] flex-col justify-between px-5 pb-8 sm:px-8 lg:px-12">
        <div className="max-w-4xl">
          <div className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5a210f]">
            <span className="h-px w-10 bg-[#5a210f]/60" />
            Context-aware recovery intelligence
          </div>

          <h1 className="text-[clamp(3.6rem,7.6vw,7.5rem)] font-medium leading-[0.91] tracking-[-0.065em]">
            Recovery that
            <br />
            protects
            <span className="hero-word-window ml-[0.08em] text-[#4a180c]">
              <span className="hero-word-rail">
                <span>trust.</span>
                <span>growth.</span>
                <span>people.</span>
                <span>futures.</span>
                <span aria-hidden="true">trust.</span>
              </span>
            </span>
          </h1>

          <div className="mt-9 grid max-w-2xl gap-7 border-t border-[#5a210f]/25 pt-7 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-base leading-relaxed text-[#652713] sm:text-lg">
              RecoveryAI turns borrower context into timely, personalized
              repayment strategies—helping lenders recover more without
              sacrificing the customer relationship.
            </p>
            <Button
              asChild
              className="group h-14 rounded-2xl bg-[#42170d] px-6 text-[#fff8ed] shadow-none hover:bg-[#2f0f08]"
            >
              <Link href="#features">
                Explore the approach
                <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 overflow-hidden rounded-[1.35rem] border border-[#5a210f]/20 bg-[#42170d]/20 text-[#5a210f] backdrop-blur-sm sm:grid-cols-3">
          {[
            ["01", "Read the full borrower context"],
            ["02", "Choose a respectful next action"],
            ["03", "Learn from every recovery outcome"],
          ].map(([number, label], index) => (
            <div
              className="flex items-center gap-4 border-[#5a210f]/20 px-5 py-4 sm:border-r sm:last:border-r-0"
              key={number}
            >
              <span className="text-xs font-semibold">{number}</span>
              <span className="text-sm font-medium">{label}</span>
              {index === 2 && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#4a180c]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
