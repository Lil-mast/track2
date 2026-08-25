import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl overflow-hidden px-4 py-28 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#5a210f]/20 bg-[#42170d] p-10 text-center text-[#fff8ed] shadow-[0_24px_70px_rgba(74,24,12,0.25)] sm:p-12 md:p-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(243,107,33,0.35),transparent_55%)]"
        />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Transform Loan Recovery{" "}
            <br className="hidden sm:block" />
            <span className="text-[#ff9b55]">With AI Intelligence.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium text-[#f2cfb9] md:text-xl">
            Join the forward-thinking fintech lenders utilizing RecoveryAI to
            turn delinquencies into retention channels.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="h-14 rounded-full bg-[#fff3dc] px-8 text-[#42170d] shadow-none hover:bg-white"
            >
              <Link href="/dashboard">
                Start Building Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              className="h-14 rounded-full border border-[#ff9b55]/35 bg-transparent px-8 text-[#fff8ed] shadow-none hover:bg-white/5"
            >
              <Link href="#features">Contact Sales Teams</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
