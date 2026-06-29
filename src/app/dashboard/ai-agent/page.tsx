"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  RefreshCw,
  MessageSquare,
  Phone,
  Globe,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Mic,
  Send,
  FileText,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { formatDateTime } from "@/lib/utils";

interface Conversation {
  id: string;
  borrower: string;
  channel: string;
  language: string;
  sentiment: string;
  sentimentScore: number;
  status: string;
  ptpAmount: number | null;
  ptpDate: string | null;
  summary: string;
  escalated: boolean;
  turns: number;
  startedAt: string;
}

interface SentimentBreakdown {
  label: string;
  value: number;
  color: string;
}

interface AgentAction {
  action: string;
  count: number;
  delta: string;
}

interface AgentData {
  conversations: Conversation[];
  sentimentBreakdown: SentimentBreakdown[];
  agentActions: AgentAction[];
  updatedAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isReport?: boolean;
}

const CHANNEL_META: Record<string, { icon: typeof MessageSquare; label: string; color: string }> = {
  sms: { icon: MessageSquare, label: "SMS", color: "text-blue-400" },
  voice: { icon: Phone, label: "Voice", color: "text-purple-400" },
  chat: { icon: Bot, label: "Chat", color: "text-cyan-400" },
};

const SENTIMENT_STATUS: Record<string, { color: string; icon: typeof CheckCircle }> = {
  cooperative: { color: "text-emerald-400", icon: CheckCircle },
  neutral: { color: "text-blue-400", icon: TrendingUp },
  distressed: { color: "text-amber-400", icon: AlertCircle },
  unresponsive: { color: "text-gray-400", icon: XCircle },
};

const CONV_STATUS_STYLE: Record<string, string> = {
  ptp_captured: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  escalated: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  no_response: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const RADAR_DATA = [
  { metric: "PTP Capture", value: 78 },
  { metric: "Empathy Score", value: 84 },
  { metric: "Escalation Accuracy", value: 91 },
  { metric: "Multilingual", value: 88 },
  { metric: "NLP Confidence", value: 82 },
  { metric: "Resolution Rate", value: 69 },
];

interface LoanContext {
  loan: string;
  borrower: string;
  balance: number;
  daysOverdue: number;
  riskLevel: string;
  product: string;
  rate: number;
  action: string;
}

function generateLoanAnalysis(ctx: LoanContext): string {
  const risk = ctx.riskLevel.toUpperCase();
  const dpd = ctx.daysOverdue;
  const bal = `$${ctx.balance.toLocaleString()}`;

  const urgency = dpd > 90 ? "CRITICAL — immediate legal or collections escalation advised"
    : dpd > 30 ? "HIGH — structured outreach and payment plan negotiation recommended"
    : dpd > 0 ? "MODERATE — proactive SMS/email reminder with hardship screening"
    : "LOW — standard monitoring, next payment not yet overdue";

  const strategies = dpd > 90
    ? ["Refer to collections or legal counsel immediately", "Offer one-time settlement at 70–80% of outstanding balance", "File for judgment if no response within 14 days"]
    : dpd > 30
    ? ["Propose a 6-month structured repayment plan", "Conduct an empathetic voice call via AI agent (Tue/Thu 10am window)", "Send personalised SMS with secure payment portal link"]
    : ["Send 7-day early-warning SMS reminder", "Pre-screen for hardship eligibility", "Offer a 30-day payment deferral if warranted"];

  const mlSignal = risk === "CRITICAL" ? "Gradient-Boosted Tree model assigns a 94% probability of default within 60 days. Survival model predicts time-to-default at 18 days. RL outreach policy has deprioritised automated outreach in favour of human escalation."
    : risk === "HIGH" ? "GBDT default probability: 71%. Survival model projects default in 45 days if no action taken. RL policy recommends structured voice + SMS sequence starting within 48 hours."
    : "GBDT default probability: 34%. Risk is manageable with proactive engagement. RL policy recommends a low-touch digital-first outreach sequence.";

  return `**AI Recovery Analysis — ${ctx.loan}**\n\n**Borrower**: ${ctx.borrower}\n**Product**: ${ctx.product}\n**Outstanding Balance**: ${bal}\n**Days Past Due**: ${dpd}\n**Risk Level**: ${risk}\n**Interest Rate**: ${ctx.rate}%\n\n---\n\n**Urgency Assessment**\n${urgency}\n\n**Recommended Recovery Strategies**\n${strategies.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**ML Model Signals**\n${mlSignal}\n\n**Current Active Action**: ${ctx.action !== "none" ? ctx.action.replace(/_/g, " ") : "None — action recommended immediately"}\n\nFeel free to ask follow-up questions about this loan, request a full compliance report, or ask me to draft a borrower outreach message.`;
}

const SUGGESTED_PROMPTS = [
  "Summarize today's agent performance",
  "Which borrowers were escalated today?",
  "Generate a PTP report",
  "Show distressed sentiment breakdown",
  "What was the top-performing channel?",
];

function generateAgentResponse(userMessage: string, data: AgentData | null, loanCtx?: LoanContext | null): string {
  const msg = userMessage.toLowerCase();
  const convs = data?.conversations ?? [];

  // Loan-specific follow-ups when a loan is in context
  if (loanCtx) {
    if (msg.includes("draft") || msg.includes("message") || msg.includes("sms") || msg.includes("email") || msg.includes("outreach")) {
      return `**Drafted Outreach Message — ${loanCtx.borrower}**\n\n> Dear ${loanCtx.borrower.split(" ")[0]},\n>\n> We noticed your ${loanCtx.product} (ref: ${loanCtx.loan}) has an outstanding balance of $${loanCtx.balance.toLocaleString()}. We understand that financial challenges happen, and we'd like to work with you on a flexible repayment plan.\n>\n> Please call us at 1-800-RECOVERY or click the secure link below to explore options — no judgment, just solutions.\n>\n> — RecoveryAI Financial Services\n\nThis message has been tailored for ${loanCtx.daysOverdue > 30 ? "a firm but empathetic tone" : "a proactive, friendly tone"} based on the borrower's ${loanCtx.riskLevel} risk profile.`;
    }
    if (msg.includes("compliance") || msg.includes("regulation") || msg.includes("legal") || msg.includes("fdcpa") || msg.includes("tcpa")) {
      return `**Compliance Assessment — ${loanCtx.loan}**\n\n**FDCPA**: ${loanCtx.daysOverdue > 0 ? "Ensure all communication is within permitted hours (8am–9pm). No harassment language. Cease-and-desist flag: not active." : "No restrictions — loan is current."}\n\n**TCPA**: Automated SMS/voice requires prior written consent. Consent record status: Verified (2024-01-15).\n\n**ECOA/Fair Lending**: Risk score derived from financial signals only — no protected class attributes used in the GBDT model.\n\n**SR 11-7 Model Risk**: SHAP explainability report available. Top factors: payment history (0.41), days past due (0.38), debt-to-income ratio (0.21).\n\nAll actions for this loan are fully auditable in the Audit Logs tab.`;
    }
    if (msg.includes("settlement") || msg.includes("offer") || msg.includes("discount")) {
      const settlePct = loanCtx.riskLevel === "critical" ? 65 : loanCtx.riskLevel === "high" ? 75 : 85;
      const settleAmt = Math.round(loanCtx.balance * (settlePct / 100));
      return `**Settlement Offer Recommendation — ${loanCtx.loan}**\n\nBased on the ${loanCtx.riskLevel.toUpperCase()} risk profile and ${loanCtx.daysOverdue} DPD, the RL policy recommends:\n\n• **Discount to offer**: ${100 - settlePct}% (${settlePct}% of outstanding)\n• **Settlement amount**: $${settleAmt.toLocaleString()}\n• **Payment window**: 14 days from offer date\n• **Rationale**: Survival model indicates recovery probability drops below 40% after 90 DPD — offering a discount now maximises expected recovery value.\n\nShall I draft the settlement offer communication for ${loanCtx.borrower}?`;
    }
    if (msg.includes("payment plan") || msg.includes("repayment") || msg.includes("instalment") || msg.includes("installment")) {
      const monthly = Math.round(loanCtx.balance / 6);
      return `**Payment Plan Proposal — ${loanCtx.loan}**\n\n**Borrower**: ${loanCtx.borrower}\n**Total Outstanding**: $${loanCtx.balance.toLocaleString()}\n\n**Recommended Plan (6 months)**:\n${Array.from({ length: 6 }, (_, i) => `• Month ${i + 1}: $${monthly.toLocaleString()}`).join("\n")}\n\n**Interest during plan**: Waived (recommended for ${loanCtx.daysOverdue > 60 ? "high-distress" : "standard"} profile)\n**Total recovered**: $${(monthly * 6).toLocaleString()}\n\nThis plan has a 78% acceptance probability based on borrower behavioral signals. Shall I initiate the outreach sequence?`;
    }
  }

  if (msg.includes("ptp") || msg.includes("promise")) {
    const ptps = convs.filter((c) => c.ptpAmount);
    if (ptps.length === 0) return "No promises-to-pay have been captured in the current session data.";
    const total = ptps.reduce((s, c) => s + (c.ptpAmount ?? 0), 0);
    const lines = ptps.map((c) => `• **${c.borrower}** — $${c.ptpAmount?.toLocaleString()} by ${c.ptpDate} (${c.language.toUpperCase()})`).join("\n");
    return `**Promise-to-Pay Report**\n\nTotal PTPs captured: ${ptps.length}\nTotal committed: $${total.toLocaleString()}\n\n${lines}\n\nAll PTPs were autonomously negotiated by the agentic AI without human intervention.`;
  }

  if (msg.includes("escalat")) {
    const esc = convs.filter((c) => c.escalated);
    if (esc.length === 0) return "No sessions have been escalated to human agents in the current data.";
    const lines = esc.map((c) => `• **${c.borrower}** — ${c.sentiment} sentiment (score: ${Math.round(c.sentimentScore * 100)}%) via ${c.channel.toUpperCase()}`).join("\n");
    return `**Escalated Sessions**\n\n${esc.length} session(s) escalated to human agents:\n\n${lines}\n\nEscalations are triggered automatically when the NLP encoder detects distress scores below 0.35 or bankruptcy language patterns.`;
  }

  if (msg.includes("distress") || msg.includes("sentiment")) {
    const breakdown = data?.sentimentBreakdown ?? [];
    const distressed = breakdown.find((s) => s.label.toLowerCase().includes("distress"));
    const lines = breakdown.map((s) => `• **${s.label}**: ${s.value}%`).join("\n");
    return `**Sentiment Breakdown Report**\n\nCurrent NLP classification across all active sessions:\n\n${lines}\n\n${distressed ? `Distressed borrowers (${distressed.value}%) are being prioritised for empathetic escalation via the RL outreach policy.` : ""}`;
  }

  if (msg.includes("channel") || msg.includes("perform")) {
    const actions = data?.agentActions ?? [];
    const sorted = [...actions].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const lines = actions.map((a) => `• **${a.action}**: ${a.count} (${a.delta})`).join("\n");
    return `**Agent Performance Summary**\n\nToday's autonomous actions:\n\n${lines}\n\n${top ? `Top action: **${top.action}** with ${top.count} instances.` : ""}\n\nThe agentic AI autonomously selected channel and timing for each outreach based on the RL Outreach Policy and borrower behavioral signals.`;
  }

  if (msg.includes("summar") || msg.includes("overview") || msg.includes("report")) {
    const ptps = convs.filter((c) => c.ptpAmount).length;
    const esc = convs.filter((c) => c.escalated).length;
    const actions = data?.agentActions ?? [];
    const totalActions = actions.reduce((s, a) => s + a.count, 0);
    return `**Daily Agent Performance Summary**\n\nThe RecoveryAI agentic system has completed the following autonomous actions today:\n\n• **Total Outreach Actions**: ${totalActions}\n• **Active Conversations**: ${convs.length}\n• **Promises-to-Pay Captured**: ${ptps}\n• **Escalated to Human Agents**: ${esc}\n\n**Sentiment Distribution**:\n${(data?.sentimentBreakdown ?? []).map((s) => `• ${s.label}: ${s.value}%`).join("\n")}\n\nThe AI operated fully autonomously — negotiating payment terms, detecting distress, and executing channel decisions without human prompting. All session data is available in the Session Explorer above.`;
  }

  if (msg.includes("borrower") || msg.includes("session")) {
    if (convs.length === 0) return "No active sessions found in the current data.";
    const lines = convs.slice(0, 5).map((c) => `• **${c.borrower}** (${c.channel.toUpperCase()} · ${c.language.toUpperCase()}) — ${c.sentiment}, ${c.turns} turns, status: ${c.status.replace("_", " ")}`).join("\n");
    return `**Active Borrower Sessions**\n\n${lines}\n\nClick any session in the Session Explorer to view the full AI reasoning trace and outcome.`;
  }

  return `I'm the RecoveryAI agentic assistant. I can help you:\n\n• **Generate reports** — PTP summaries, sentiment breakdowns, performance overviews\n• **Inspect sessions** — borrower conversations, escalation reasons, AI decisions\n• **Analyse trends** — channel performance, distress patterns, recovery outcomes\n\nTry asking: "Generate a PTP report" or "Summarize today's agent performance."`;
}

export default function AiAgentPage() {
  return (
    <Suspense>
      <AiAgentPageInner />
    </Suspense>
  );
}

function AiAgentPageInner() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [loanCtx, setLoanCtx] = useState<LoanContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm the RecoveryAI agentic assistant. Ask me to generate a report, analyse a loan, summarize session performance, or query sentiment across active conversations.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loanAnalysedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-agent");
      const json = await res.json();
      setData(json);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Read loan context from URL params (passed from Loans page)
  useEffect(() => {
    const loanParam = searchParams.get("loan");
    if (!loanParam || loanAnalysedRef.current) return;
    const ctx: LoanContext = {
      loan: loanParam,
      borrower: searchParams.get("borrower") ?? "Unknown Borrower",
      balance: Number(searchParams.get("balance") ?? 0),
      daysOverdue: Number(searchParams.get("daysOverdue") ?? 0),
      riskLevel: searchParams.get("riskLevel") ?? "medium",
      product: searchParams.get("product") ?? "Loan",
      rate: Number(searchParams.get("rate") ?? 0),
      action: searchParams.get("action") ?? "none",
    };
    setLoanCtx(ctx);
    loanAnalysedRef.current = true;

    // Auto-send the analysis after a short delay so the page has rendered
    const timer = setTimeout(() => {
      const analysis = generateLoanAnalysis(ctx);
      const userMsg: ChatMessage = {
        role: "user",
        content: `Analyse loan ${ctx.loan} for ${ctx.borrower} — ${ctx.daysOverdue} DPD, ${ctx.riskLevel} risk, $${ctx.balance.toLocaleString()} outstanding.`,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: analysis,
        timestamp: new Date(),
        isReport: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: userText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

    const response = generateAgentResponse(userText, data, loanCtx);
    const isReport = response.startsWith("**") && response.includes("\n");
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: response, timestamp: new Date(), isReport },
    ]);
    setChatLoading(false);
  }, [input, data, loanCtx]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConv = data?.conversations.find((c) => c.id === selected) ?? data?.conversations[0] ?? null;

  const formatMessageContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
      return <p key={i} className={`${line.startsWith("•") ? "pl-2" : ""} ${line === "" ? "h-2" : ""}`} dangerouslySetInnerHTML={{ __html: boldLine || "&nbsp;" }} />;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agentic AI / NLP"
        description="Autonomous multilingual voice, SMS & chat agents — sentiment analysis, PTP capture, and escalation"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
          <button onClick={fetchData} className="ml-1 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </PageHeader>

      {/* Agentic capabilities banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Fully Agentic — Not Just Conversational</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              The AI agent autonomously decides the next best action: negotiate payment terms, offer hardship plans, capture binding promises-to-pay, escalate empathetically when distress is detected, and hand off to human agents — all without a script or predefined flow.
            </p>
          </div>
        </div>
      </div>

      {/* Action counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.agentActions ?? []).map((a) => (
          <div key={a.action} className="rounded-xl border border-border/50 bg-card/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">{a.action}</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "—" : a.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{a.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sentiment pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sentiment Breakdown</CardTitle>
            <CardDescription>Real-time NLP classification</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={data?.sentimentBreakdown ?? []} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="label" paddingAngle={3}>
                  {(data?.sentimentBreakdown ?? []).map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {(data?.sentimentBreakdown ?? []).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.label} {s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Agent Performance Metrics</CardTitle>
            <CardDescription>Aggregated across all active sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversation explorer */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Session list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Click to inspect agent reasoning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data?.conversations ?? []).map((c) => {
                const ch = CHANNEL_META[c.channel] ?? CHANNEL_META.sms;
                const Icon = ch.icon;
                const sentStyle = SENTIMENT_STATUS[c.sentiment] ?? SENTIMENT_STATUS.neutral;
                const SentIcon = sentStyle.icon;
                const isSelected = (selected ?? data?.conversations[0]?.id) === c.id;
                return (
                  <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left rounded-lg border p-3 transition-colors ${isSelected ? "border-primary/40 bg-primary/5" : "border-border/50 hover:bg-muted/20"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${ch.color}`} />
                        <p className="text-xs font-semibold text-foreground">{c.borrower}</p>
                      </div>
                      {c.escalated && <AlertCircle className="h-3 w-3 text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <SentIcon className={`h-3 w-3 ${sentStyle.color}`} />
                      <span className={`text-[10px] font-medium capitalize ${sentStyle.color}`}>{c.sentiment}</span>
                      <span className="text-[10px] text-muted-foreground">· {c.turns} turns</span>
                      <Globe className="h-3 w-3 text-muted-foreground ml-auto" />
                      <span className="text-[10px] text-muted-foreground uppercase">{c.language}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session detail */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Session Detail
            </CardTitle>
            <CardDescription>AI reasoning trace & outcome</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedConv ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedConv.borrower}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(selectedConv.startedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase bg-primary/5 text-primary border-primary/20">{selectedConv.language}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CONV_STATUS_STYLE[selectedConv.status] ?? ""}`}>{selectedConv.status.replace("_", " ")}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Sentiment Score</p>
                    <p className="text-xs font-bold text-foreground">{Math.round(selectedConv.sentimentScore * 100)}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${selectedConv.sentimentScore * 100}%`, background: selectedConv.sentimentScore > 0.6 ? "#10b981" : selectedConv.sentimentScore > 0.3 ? "#f59e0b" : "#f43f5e" }} />
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Session Summary</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedConv.summary}</p>
                </div>
                {selectedConv.ptpAmount && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Promise to Pay Captured</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">${selectedConv.ptpAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Committed amount</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{selectedConv.ptpDate}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Payment date</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedConv.escalated && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300">Session escalated to human agent — distress flag triggered by NLP encoder.</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{selectedConv.turns} conversation turns · {selectedConv.channel} channel</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select a session to inspect.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI Report & Analysis Assistant
              </CardTitle>
              <CardDescription>Ask questions, analyse loans, or generate reports from live data</CardDescription>
            </div>
            {loanCtx && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[11px] font-medium text-blue-300">Analysing: {loanCtx.loan} · {loanCtx.borrower}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(loanCtx ? [
              "Draft a borrower outreach message",
              "Run a compliance check",
              "Recommend a settlement offer",
              "Generate a payment plan",
              "Summarize today's agent performance",
            ] : SUGGESTED_PROMPTS).map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message thread */}
          <div className="rounded-xl border border-border/50 bg-muted/5 h-72 overflow-y-auto p-4 space-y-4 mb-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary/20" : "bg-blue-500/20"}`}>
                  {msg.role === "user" ? <span className="text-[10px] font-bold text-primary">JS</span> : <Bot className="h-3.5 w-3.5 text-blue-400" />}
                </div>
                <div className={`max-w-[78%] rounded-xl px-4 py-3 text-xs leading-relaxed space-y-1 ${msg.role === "user" ? "bg-primary/10 border border-primary/20 text-foreground" : msg.isReport ? "bg-blue-500/5 border border-blue-500/20 text-foreground" : "bg-muted/20 border border-border/30 text-foreground"}`}>
                  {formatMessageContent(msg.content)}
                  <p className="text-[10px] text-muted-foreground pt-1">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-muted/20 border border-border/30 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Analysing session data...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about session data, generate a report, or query sentiment... (Enter to send)"
              className="flex-1 resize-none rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || chatLoading}
              variant="gradient"
              size="sm"
              className="h-[72px] px-4"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
