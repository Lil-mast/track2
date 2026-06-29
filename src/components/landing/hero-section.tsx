"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "recoveryai-ds";

export function HeroSection() {
  const [demoStatus, setDemoStatus] = useState<
    "idle" | "running" | "scheduled" | "completed"
  >("idle");
  const [recoveryScore, setRecoveryScore] = useState(84);

  const triggerDemo = () => {
    if (demoStatus !== "idle") return;
    setDemoStatus("running");
    setTimeout(() => {
      setRecoveryScore(92);
      setDemoStatus("scheduled");
      setTimeout(() => setDemoStatus("completed"), 2000);
    }, 2000);
  };

  const resetDemo = () => {
    setRecoveryScore(84);
    setDemoStatus("idle");
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-36 pb-20 flex flex-col items-center z-10">
      {/* Ambient grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-wide uppercase mb-8 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        v2.0: Next-Gen AI Recovery Engine
      </div>

      {/* Headline */}
      <h1 className="text-center font-extrabold text-5xl sm:text-6xl md:text-7xl text-white tracking-tight max-w-5xl leading-[1.08] mb-6">
        AI That Turns Debt Recovery Into{" "}
        <br className="hidden sm:block" />
        <span className="text-gradient-cyan">Customer Success.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-center text-slate-400 text-lg md:text-xl font-medium max-w-3xl leading-relaxed mb-10">
        RecoveryAI utilizes context-aware Generative AI to design
        hyper-personalized repayment strategies, maximizing recovery rates while
        safeguarding customer trust.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 z-20">
        <Button
          variant="gradient"
          size="pill"
          onClick={triggerDemo}
          className="gap-2"
        >
          {demoStatus === "idle" && "Trigger Live Demo"}
          {demoStatus === "running" && "Analyzing Portfolio..."}
          {demoStatus === "scheduled" && "Simulating Payment..."}
          {demoStatus === "completed" && "Recovery Success!"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>

        {demoStatus !== "idle" ? (
          <button
            onClick={resetDemo}
            className="px-6 py-4 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all font-semibold text-sm"
          >
            Reset Simulation
          </button>
        ) : (
          <Button variant="outline" size="pill" asChild>
            <Link href="/dashboard">
              <Sparkles className="h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        )}
      </div>

      {/* Dashboard mockup */}
      <div className="w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-[#0b0f19]/40 backdrop-blur-md p-4 sm:p-6 shadow-2xl relative group/dashboard">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-70 blur-2xl group-hover/dashboard:opacity-100 transition-opacity duration-700" />

        {/* Top bar */}
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/40" />
          </div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase hidden sm:block">
            Platform Portfolio Live Simulator
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${demoStatus === "running" ? "bg-amber-400 animate-ping" : "bg-emerald-500"}`}
            />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {demoStatus === "running" ? "AI Optimizing" : "System Active"}
            </span>
          </div>
        </div>

        {/* Dashboard columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Recovery Score */}
          <div className="border border-white/[0.08] bg-slate-900/40 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group/card hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="6"
                />
                <circle
                  className="transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="url(#hero-gauge-grad)"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - 251.2 * (recoveryScore / 100)}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="hero-gauge-grad"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#00d2ff" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white tracking-tight transition-all duration-500">
                  {recoveryScore}%
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Health Index
                </span>
              </div>
            </div>
            <div className="text-center relative z-10">
              <h4 className="text-sm font-semibold text-slate-300 mb-1">
                Portfolio Recovery Score
              </h4>
              <p className="text-xs text-slate-500">
                Auto-calculated risk-repayment ratio
              </p>
            </div>
          </div>

          {/* Trend Graph */}
          <div className="md:col-span-2 border border-white/[0.08] bg-slate-900/40 rounded-xl p-6 flex flex-col justify-between group/card hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h4 className="text-sm font-semibold text-slate-300">
                  Recovery Trend (30 Days)
                </h4>
                <p className="text-xs text-slate-500">
                  Standard vs RecoveryAI Performance
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                +14.8% Efficiency
              </span>
            </div>
            <div className="relative h-28 w-full mt-2">
              <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path
                  d="M0,80 Q25,82 50,75 T100,70"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <path
                  className="transition-all duration-1000"
                  d={
                    demoStatus === "idle"
                      ? "M0,80 Q25,60 50,45 T100,35"
                      : "M0,80 Q25,45 50,25 T100,12"
                  }
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
                <path
                  className="transition-all duration-1000"
                  d={
                    demoStatus === "idle"
                      ? "M0,80 Q25,60 50,45 T100,35 L100,100 L0,100 Z"
                      : "M0,80 Q25,45 50,25 T100,12 L100,100 L0,100 Z"
                  }
                  fill="url(#hero-trend-glow)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient
                    id="hero-trend-glow"
                    x1="0%"
                    x2="0%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <circle
                  className="animate-ping"
                  cx="100"
                  cy={demoStatus === "idle" ? "35" : "12"}
                  r="5"
                  fill="#00d2ff"
                />
                <circle
                  cx="100"
                  cy={demoStatus === "idle" ? "35" : "12"}
                  r="3.5"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div className="flex justify-between items-center mt-4 text-[10px] text-slate-500 font-medium border-t border-white/[0.05] pt-3">
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day 30 (Forecast)</span>
            </div>
          </div>
        </div>

        {/* Status feed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-6">
          <div className="flex items-center gap-4 border border-white/[0.08] bg-slate-900/40 rounded-xl p-4 hover:border-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold shrink-0 text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white truncate">
                John Doe (Acme Capital)
              </h5>
              <p className="text-[10px] text-slate-400 truncate">
                Risk Status:{" "}
                <span className="text-emerald-400">Optimized</span> · Channel:
                SMS Nudge
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-slate-300">
                $1,250.00
              </span>
              <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider">
                Balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border border-white/[0.08] bg-slate-900/40 rounded-xl p-4 hover:border-slate-800 transition-colors relative overflow-hidden">
            {demoStatus === "running" && (
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
            )}
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 text-xs font-bold">
              {demoStatus === "completed" ? "✓" : "↻"}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">
                {demoStatus === "idle" && "Simulator Idle"}
                {demoStatus === "running" && "AI Analysis Running"}
                {demoStatus === "scheduled" && "Nudge Sent Successfully"}
                {demoStatus === "completed" && "Payment Complete"}
              </h5>
              <p className="text-[10px] text-slate-500 truncate">
                {demoStatus === "idle" &&
                  "Click 'Trigger Live Demo' above to begin"}
                {demoStatus === "running" &&
                  "Reading context data with Amazon Nova"}
                {demoStatus === "scheduled" && "SMS link opened by borrower"}
                {demoStatus === "completed" && "$1,250.00 recovered instantly"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
