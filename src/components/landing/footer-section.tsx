import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-10 sm:px-6">
      <div className="footer-alive relative overflow-hidden rounded-t-[2rem] border border-[#ff9b55]/25 bg-[#42170d]/95 px-6 py-12 shadow-[0_24px_60px_-12px_rgba(66,23,13,0.7),inset_0_1px_0_0_rgba(255,243,220,0.12),0_0_50px_-8px_rgba(243,107,33,0.45)] backdrop-blur-3xl sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="footer-breathe footer-breathe-a pointer-events-none absolute -bottom-24 -left-10 z-0 h-[280px] w-[520px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(243,107,33,0.85)_0%,rgba(243,107,33,0)_70%)] blur-[36px]"
        />
        <div
          aria-hidden="true"
          className="footer-breathe footer-breathe-b pointer-events-none absolute -top-16 -right-6 z-0 h-[260px] w-[480px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,155,85,0.7)_0%,rgba(255,155,85,0)_70%)] blur-[34px]"
        />
        <div
          aria-hidden="true"
          className="footer-breathe footer-breathe-c pointer-events-none absolute -bottom-28 left-[30%] z-0 h-[240px] w-[460px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,243,220,0.45)_0%,rgba(255,243,220,0)_70%)] blur-[32px]"
        />
        <div
          aria-hidden="true"
          className="footer-breathe footer-breathe-d pointer-events-none absolute left-1/2 top-1/2 z-0 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,155,85,0.55)_0%,rgba(255,155,85,0)_70%)] blur-[28px]"
        />

        <div className="relative z-10 flex max-w-xl flex-col gap-5">
          <Link
            href="/"
            className="group inline-flex w-fit items-center gap-2.5 text-[#fff8ed]"
          >
            <span
              aria-hidden="true"
              className="footer-mark grid h-7 w-7 grid-cols-2 gap-1 rounded-md bg-[#f36b21] p-1.5 shadow-[0_0_20px_rgba(243,107,33,0.55)]"
            >
              <span className="rounded-[2px] bg-[#fff8ed]" />
              <span className="rounded-[2px] bg-[#fff8ed]/55" />
              <span className="rounded-[2px] bg-[#fff8ed]/55" />
              <span className="rounded-[2px] bg-[#fff8ed]" />
            </span>
            <span className="text-xl font-bold uppercase tracking-[0.12em]">
              Recovery
              <span className="text-[#ff9b55] transition-colors group-hover:text-[#fff3dc]">
                AI
              </span>
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-relaxed text-[#f2cfb9]">
            Financial empowerment, powered by AI. Context-aware recovery built
            to protect trust and restore momentum.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="footer-shimmer relative z-10 my-10 h-px w-full"
        />

        <p className="relative z-10 text-xs uppercase tracking-[0.06em] text-[#e8b99d]">
          &copy; {new Date().getFullYear()} RecoveryAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
