"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Send, User, FileText, Sparkles, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isReport?: boolean;
}

interface LoanContext {
  loan: string;
  borrower: string;
  balance: number;
  daysOverdue: number;
  riskLevel: string;
  product: string;
  rate: number;
}

const SUGGESTED_PROMPTS = [
  "Summarize today's recovery performance",
  "Which borrowers are at highest risk of default?",
  "Generate a PTP report",
  "What outreach channels performed best?",
  "Show compliance status overview",
];

const LOAN_PROMPTS = [
  "Draft a borrower outreach message",
  "Run a compliance check on this loan",
  "Recommend a settlement offer",
  "Generate a 6-month payment plan",
  "What is the default probability?",
];

function generateLoanAnalysis(ctx: LoanContext): string {
  const dpd = ctx.daysOverdue;
  const bal = `$${ctx.balance.toLocaleString()}`;
  const risk = ctx.riskLevel.toUpperCase();

  const urgency =
    dpd > 90
      ? "CRITICAL — immediate legal or collections escalation advised."
      : dpd > 30
        ? "HIGH — structured outreach and payment plan negotiation recommended."
        : dpd > 0
          ? "MODERATE — proactive SMS/email reminder with hardship screening."
          : "LOW — standard monitoring, next payment not yet overdue.";

  const strategies =
    dpd > 90
      ? ["Refer to collections or legal counsel immediately", "Offer one-time settlement at 70–80% of outstanding balance", "File for judgment if no response within 14 days"]
      : dpd > 30
        ? ["Propose a 6-month structured repayment plan", "Conduct empathetic voice call via AI agent (Tue/Thu 10am)", "Send personalised SMS with secure payment portal link"]
        : ["Send 7-day early-warning SMS reminder", "Pre-screen for hardship eligibility", "Offer a 30-day payment deferral if warranted"];

  const mlSignal =
    risk === "CRITICAL"
      ? "GBDT model assigns 94% default probability within 60 days. Survival model: 18 days to default. RL policy recommends human escalation over automated outreach."
      : risk === "HIGH"
        ? "GBDT default probability: 71%. Survival model projects default in 45 days without action. RL policy: structured voice + SMS sequence within 48 hours."
        : "GBDT default probability: 34%. Risk is manageable with proactive engagement. RL policy recommends low-touch digital-first outreach.";

  return `**AI Recovery Analysis — ${ctx.loan}**

**Borrower**: ${ctx.borrower}
**Product**: ${ctx.product}
**Outstanding Balance**: ${bal}
**Days Past Due**: ${dpd}
**Risk Level**: ${risk}
**Interest Rate**: ${ctx.rate}%

---

**Urgency Assessment**
${urgency}

**Recommended Recovery Strategies**
${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**ML Model Signals**
${mlSignal}

Ask me to draft an outreach message, run a compliance check, recommend a settlement, or generate a payment plan for this loan.`;
}

function generateResponse(msg: string, ctx: LoanContext | null): string {
  const q = msg.toLowerCase();

  if (ctx) {
    if (q.includes("draft") || q.includes("message") || q.includes("outreach") || q.includes("sms")) {
      return `**Drafted Outreach — ${ctx.borrower}**

> Dear ${ctx.borrower.split(" ")[0]},
>
> We noticed your ${ctx.product} (ref: ${ctx.loan}) has an outstanding balance of $${ctx.balance.toLocaleString()}. We understand financial challenges happen, and we'd like to work with you on a flexible solution.
>
> Please call us at 1-800-RECOVERY or use the secure link below to explore your options — no judgment, just solutions.
>
> — RecoveryAI Financial Services

Tone: ${ctx.daysOverdue > 30 ? "firm but empathetic" : "proactive and friendly"} (based on ${ctx.riskLevel} risk profile).`;
    }

    if (q.includes("compliance") || q.includes("regulation") || q.includes("fdcpa") || q.includes("tcpa")) {
      return `**Compliance Assessment — ${ctx.loan}**

**FDCPA**: ${ctx.daysOverdue > 0 ? "All communication must be within permitted hours (8am–9pm local). No harassment language. Cease-and-desist flag: not active." : "No restrictions — loan is current."}

**TCPA**: Automated SMS/voice requires prior written consent. Consent status: Verified.

**ECOA / Fair Lending**: Risk score uses financial signals only — no protected class attributes in the GBDT model.

**SR 11-7 Model Risk**: SHAP explainability available. Top factors: payment history (0.41), days past due (0.38), debt-to-income (0.21).

All actions are fully auditable in the Audit Logs page.`;
    }

    if (q.includes("settlement") || q.includes("offer") || q.includes("discount")) {
      const pct = ctx.riskLevel === "critical" ? 65 : ctx.riskLevel === "high" ? 75 : 85;
      const amt = Math.round(ctx.balance * (pct / 100));
      return `**Settlement Offer — ${ctx.loan}**

Based on ${ctx.riskLevel.toUpperCase()} risk and ${ctx.daysOverdue} DPD, the RL policy recommends:

- **Discount**: ${100 - pct}% off outstanding balance
- **Settlement amount**: $${amt.toLocaleString()}
- **Payment window**: 14 days from offer date
- **Rationale**: Survival model indicates recovery probability drops below 40% after 90 DPD — discounting now maximises expected recovery value.

Shall I draft the settlement communication for ${ctx.borrower}?`;
    }

    if (q.includes("payment plan") || q.includes("repayment") || q.includes("instalment") || q.includes("installment")) {
      const monthly = Math.round(ctx.balance / 6);
      return `**6-Month Payment Plan — ${ctx.loan}**

**Borrower**: ${ctx.borrower}
**Total Outstanding**: $${ctx.balance.toLocaleString()}

${Array.from({ length: 6 }, (_, i) => `- Month ${i + 1}: $${monthly.toLocaleString()}`).join("\n")}

**Interest during plan**: Waived (recommended for ${ctx.daysOverdue > 60 ? "high-distress" : "standard"} profile)
**Total recovered**: $${(monthly * 6).toLocaleString()}

This plan has a 78% acceptance probability based on borrower behavioural signals.`;
    }

    if (q.includes("default probability") || q.includes("risk score") || q.includes("probability")) {
      const prob = ctx.riskLevel === "critical" ? 94 : ctx.riskLevel === "high" ? 71 : ctx.riskLevel === "medium" ? 34 : 12;
      return `**Default Probability — ${ctx.loan}**

**GBDT Model Score**: ${prob}% probability of default within 60 days
**Survival Model**: Time-to-default estimate is ${prob > 70 ? "18–30 days" : prob > 40 ? "45–60 days" : "90+ days"} without intervention
**Risk Tier**: ${ctx.riskLevel.toUpperCase()}

Key contributing signals:
- Payment history weight: 0.41
- Days past due weight: 0.38
- Debt-to-income ratio weight: 0.21

SHAP explainability report is available in the Audit Logs page.`;
    }
  }

  if (q.includes("ptp") || q.includes("promise to pay") || q.includes("promise-to-pay")) {
    return `**Promise-to-Pay Report — Today**

- Total PTPs captured: 47
- Kept: 31 (66%)
- Broken: 9 (19%)
- Pending: 7 (15%)

Top performing channel: SMS bot (43% capture rate)
Average PTP amount: $1,840
Total committed value: $86,480

Sentiment at capture: 68% positive, 21% neutral, 11% negative.`;
  }

  if (q.includes("compliance") || q.includes("regulation")) {
    return `**Compliance Overview**

- FDCPA: 100% compliant — all contact within permitted hours
- TCPA: 98.2% compliant — 3 contacts flagged for review
- GDPR consent records: Up to date
- ECOA / Fair Lending: No protected-class signals in any active model
- SR 11-7: SHAP explainability reports generated for all models

Last compliance audit: Today at 06:00 UTC. No critical findings.`;
  }

  if (q.includes("risk") || q.includes("high risk") || q.includes("default")) {
    return `**High-Risk Borrower Summary**

Based on today's GBDT model run:

- **Critical** (>85% default probability): 8 borrowers
- **High** (70–85%): 14 borrowers
- **Medium** (40–70%): 31 borrowers

Top 3 by outstanding balance:
1. James Otieno — LN-1002 — $28,400 — 67 DPD
2. Amara Diallo — LN-0047 — $19,200 — 45 DPD
3. Chen Wei — LN-0093 — $14,800 — 38 DPD

Recommend immediate structured outreach for the critical tier.`;
  }

  if (q.includes("performance") || q.includes("summary") || q.includes("today")) {
    return `**Recovery Performance Summary — Today**

- Active sessions: 142
- Promises to pay captured: 47 ($86,480 committed)
- Escalations to human agents: 18
- AI-resolved without escalation: 124 (87%)

Top channel: SMS bot (61% engagement rate)
Average sentiment score: 0.62 (positive)
Recovery rate vs. yesterday: +4.3%

The RL outreach policy deprioritised evening contacts based on last week's low response data — morning window (9–11am) is performing best today.`;
  }

  if (q.includes("channel") || q.includes("sms") || q.includes("email") || q.includes("voice")) {
    return `**Channel Performance — Today**

| Channel | Contacts | Response Rate | PTP Rate |
|---------|----------|---------------|----------|
| SMS Bot | 312 | 61% | 28% |
| Email | 198 | 34% | 12% |
| Voice Bot | 87 | 49% | 31% |
| Human Agent | 23 | 91% | 67% |

The RL policy has increased SMS allocation by 15% this week based on positive response trends. Voice bot is performing strongly on high-DPD accounts.`;
  }

  return `I can help you analyse loans, generate reports, draft borrower communications, run compliance checks, or answer questions about recovery performance. 

Try asking:
- "Summarize today's recovery performance"
- "Which borrowers are at highest risk?"
- "Generate a PTP report"
- "Show compliance status"

If you came from a loan, click "Analyse with AI" on a loan detail page for a full contextual analysis.`;
}

function formatContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-foreground mb-1">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("**") && line.includes("**")) {
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className="text-sm mb-0.5">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      );
    }
    if (line.startsWith("> ")) {
      return <blockquote key={i} className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground italic my-0.5">{line.slice(2)}</blockquote>;
    }
    if (line.startsWith("- ") || line.match(/^\d+\./)) {
      return <li key={i} className="text-sm ml-4 mb-0.5 list-disc list-inside">{line.replace(/^[-\d.]\s*/, "")}</li>;
    }
    if (line === "---") {
      return <hr key={i} className="border-border my-2" />;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm mb-0.5">{line}</p>;
  });
}

export function AiAgentClient() {
  const searchParams = useSearchParams();
  const [loanCtx, setLoanCtx] = useState<LoanContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm the RecoveryAI agentic assistant. I can analyse loans, generate reports, draft borrower outreach, run compliance checks, or answer any question about your portfolio. How can I help?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoAnalysedRef = useRef(false);

  useEffect(() => {
    const loanParam = searchParams.get("loan");
    if (!loanParam || autoAnalysedRef.current) return;

    const ctx: LoanContext = {
      loan: loanParam,
      borrower: searchParams.get("borrower") ?? "Unknown Borrower",
      balance: Number(searchParams.get("balance") ?? 0),
      daysOverdue: Number(searchParams.get("daysOverdue") ?? 0),
      riskLevel: searchParams.get("riskLevel") ?? "medium",
      product: searchParams.get("product") ?? "Loan",
      rate: Number(searchParams.get("rate") ?? 0),
    };
    setLoanCtx(ctx);
    autoAnalysedRef.current = true;

    const timer = setTimeout(() => {
      const userMsg: ChatMessage = {
        role: "user",
        content: `Analyse loan ${ctx.loan} for ${ctx.borrower} — ${ctx.daysOverdue} DPD, ${ctx.riskLevel} risk, $${ctx.balance.toLocaleString()} outstanding.`,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: generateLoanAnalysis(ctx),
        timestamp: new Date(),
        isReport: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: userText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(userText, loanCtx);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        isReport: response.startsWith("**"),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentic AI Assistant"
        description="Analyse loans, generate reports, draft outreach, and query your portfolio"
      />

      <Card className="flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        <CardHeader className="shrink-0 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4 text-primary" />
                AI Chat Interface
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Ask anything about borrowers, loans, recovery strategies, or compliance
              </CardDescription>
            </div>
            {loanCtx && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">
                  Analysing: {loanCtx.loan} · {loanCtx.borrower}
                </span>
              </div>
            )}
          </div>

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(loanCtx ? LOAN_PROMPTS : SUGGESTED_PROMPTS).map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
              }`}>
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : msg.isReport
                    ? "bg-muted/60 border border-border rounded-tl-sm"
                    : "bg-muted/40 border border-border/50 rounded-tl-sm"
              }`}>
                {msg.role === "assistant" && msg.isReport ? (
                  <div className="space-y-0.5">{formatContent(msg.content)}</div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted border border-border">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Analysing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={loanCtx ? `Ask about ${loanCtx.loan}...` : "Ask anything about your portfolio..."}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>
            <Button onClick={() => handleSend()} disabled={loading || !input.trim()} size="default">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
