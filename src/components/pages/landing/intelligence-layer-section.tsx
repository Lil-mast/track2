"use client";

import React, { useState } from "react";

const steps = [
  {
    id: "step-1",
    tabLabel: "Step 01",
    title: "Seamless Data Ingestion",
    description: "Securely connect your lending database, loan management system (LMS), and communication channels via our high-speed API SDK.",
    icon: "database",
    details: [
      "Bank-grade SSL & TLS encryption during transit",
      "Real-time synchronization with major loan servicing systems",
      "Auto-parses historical borrower interaction data logs",
      "Zero impact on core database query performance"
    ],
    badge: "Ingestion System",
    visualization: (
      <div className="flex flex-col gap-4 w-full h-full justify-center p-6 border border-white/[0.08] bg-slate-950/80 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sync Status</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">CONNECTED</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs border-b border-white/[0.04] pb-2">
            <span className="text-slate-400">Total API Calls</span>
            <span className="text-white font-mono font-bold">4,129,088/s</span>
          </div>
          <div className="flex justify-between text-xs border-b border-white/[0.04] pb-2">
            <span className="text-slate-400">Sync Delay</span>
            <span className="text-white font-mono font-bold">2.4ms</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Payload Parse Rate</span>
            <span className="text-emerald-400 font-mono font-bold">100.00%</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "step-2",
    tabLabel: "Step 02",
    title: "Empathetic AI Analysis",
    description: "Amazon Nova models evaluate the delinquency timeline, past interaction records, sentiment patterns, and forecast ideal outcomes.",
    icon: "auto_awesome",
    details: [
      "Amazon Nova models fine-tuned on fintech logs",
      "Accurately maps conversational borrower sentiment indicators",
      "Forecasts optimized communication channels and day-of-week timing",
      "Drafts highly compliant context-aware message variations"
    ],
    badge: "Inference Engine",
    visualization: (
      <div className="flex flex-col gap-4 w-full h-full justify-center p-6 border border-blue-500/20 bg-[#0c101d]/60 rounded-xl relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-blue-400 text-lg animate-spin">
            auto_awesome
          </span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Nova AI Running</span>
        </div>
        <div className="space-y-3">
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full animate-pulse" style={{ width: "88%" }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Nova Sentiment Confidence</span>
            <span className="text-white font-mono font-bold">96.8%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Optimal Outcome Probability</span>
            <span className="text-white font-mono font-bold">91.2%</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "step-3",
    tabLabel: "Step 03",
    title: "Action & Automated Execution",
    description: "Automatically triggers a highly personalized message nudge with flexible smart-repayment links via SMS, Email, or WhatsApp.",
    icon: "send",
    details: [
      "Auto-execute toggles based on custom portfolio priority thresholds",
      "Dynamic generation of compliant smart-repayment portals",
      "Auto-cooldown parameters to prevent excessive notifications",
      "Direct ledger callback updates immediately upon repayment completion"
    ],
    badge: "Action Layer",
    visualization: (
      <div className="flex flex-col gap-4 w-full h-full justify-center p-6 border border-cyan-500/20 bg-slate-950/80 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/[0.01] pointer-events-none" />
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-3 mb-2">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Nudge Dispatcher</span>
          <span className="text-[10px] text-white bg-blue-500/20 px-2 py-0.5 rounded-full font-bold">DISPATCHED</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-slate-900/60 p-2 rounded border border-white/[0.04]">
            <span className="text-cyan-400 font-bold">SMS Sent:</span> &quot;Hi John, we understand things happen. Tap to review options...&quot;
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 px-1">
            <span>Delivered 1m ago</span>
            <span>Channel: WhatsApp</span>
          </div>
        </div>
      </div>
    )
  }
];

export function IntelligenceLayerSection() {
  const [activeTab, setActiveTab] = useState(1);
  const currentStep = steps[activeTab - 1];

  return (
    <section className="relative max-w-7xl mx-auto px-6 py-28 overflow-hidden border-t border-white/[0.05]">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          The Intelligence Layer
        </h2>
        <p className="text-slate-400 text-lg font-medium">
          A high-performance pipeline turning data patterns into successful recovery loops.
        </p>
      </div>

      {/* Steps horizontal selector tab layout matching reference */}
      <div className="flex justify-center items-center gap-2 max-w-md mx-auto mb-16 border border-white/[0.08] bg-slate-950/60 p-1.5 rounded-full">
        {steps.map((step, idx) => {
          const isActive = idx + 1 === activeTab;
          return (
            <button
              key={step.id}
              onClick={() => setActiveTab(idx + 1)}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-bold tracking-wide uppercase transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {step.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Bento content display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        {/* Left Side: Step Details */}
        <div className="lg:col-span-7 border border-white/[0.08] bg-[#0c101d]/20 backdrop-blur-sm p-8 rounded-2xl flex flex-col justify-between hover:border-blue-500/20 transition-all duration-300">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider uppercase mb-6 border border-blue-500/20">
              <span className="material-symbols-outlined text-sm">{currentStep.icon}</span>
              {currentStep.badge}
            </div>

            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4">
              {currentStep.title}
            </h3>

            <p className="text-slate-400 text-base leading-relaxed mb-8">
              {currentStep.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/[0.05] pt-6">
            {currentStep.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="material-symbols-outlined text-blue-400 text-base shrink-0">
                  check_circle
                </span>
                <span className="truncate">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Step Visualization Panel */}
        <div className="lg:col-span-5 flex items-center justify-center p-8 border border-white/[0.08] bg-[#0b0f19]/40 rounded-2xl relative min-h-[300px] hover:border-cyan-500/20 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_100%)] pointer-events-none" />
          <div className="w-full relative z-10">{currentStep.visualization}</div>
        </div>
      </div>
    </section>
  );
}
