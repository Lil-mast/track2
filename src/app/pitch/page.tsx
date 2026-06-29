"use client";

import { useState } from "react";
import { Slide1Cover } from "@/components/pitch/slide1-cover";
import { Slide2Problem } from "@/components/pitch/slide2-problem";
import { Slide3Tech } from "@/components/pitch/slide3-tech";
import { Slide4Workflow } from "@/components/pitch/slide4-workflow";
import { Slide5Roi } from "@/components/pitch/slide5-roi";

const SLIDES = [
  { id: 1, label: "Introduction" },
  { id: 2, label: "Problem" },
  { id: 3, label: "Tech Stack" },
  { id: 4, label: "Workflow" },
  { id: 5, label: "ROI & Impact" },
];

export default function PitchPage() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(SLIDES.length - 1, c + 1));

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/8 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Slide counter + dots navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">A</span>
          </div>
          <span className="text-sm font-semibold text-foreground/80 tracking-wide">ApexMaths</span>
        </div>

        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Go to slide ${s.label}`}
            />
          ))}
        </div>

        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </span>
      </nav>

      {/* Slide content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-7xl">
          {current === 0 && <Slide1Cover />}
          {current === 1 && <Slide2Problem />}
          {current === 2 && <Slide3Tech />}
          {current === 3 && <Slide4Workflow />}
          {current === 4 && <Slide5Roi />}
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="relative z-20 flex items-center justify-between px-8 py-5 shrink-0">
        <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
          {SLIDES[current].label}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            disabled={current === 0}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-border bg-muted/30 text-foreground disabled:opacity-30 hover:bg-muted/60 transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={next}
            disabled={current === SLIDES.length - 1}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-colors"
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  );
}
