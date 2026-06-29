"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  DollarSign,
  CheckCircle,
  Clock,
  History,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Recommendation {
  id: string;
  title: string;
  action: string;
  confidenceScore: number;
  expectedRecovery: number;
  priorityScore: number;
  borrower: { id: string; name: string; company: string };
  loan: { id: string; number: string; outstanding: number; daysOverdue: number; riskLevel: string };
  rationale: string;
  modelSignals: string[];
  status: string;
  generatedAt: string;
}

interface HistoryEntry {
  id: string;
  title: string;
  action: string;
  outcome: string;
  recoveredAmount: number;
  executedAt: string;
  borrower: string;
  notes: string;
}

interface RecoveryData {
  recommendations: Recommendation[];
  history: HistoryEntry[];
  stats: { pending: number; approved: number; executed: number; totalExpectedRecovery: number };
  updatedAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  legal_notice: "Legal Notice",
  payment_plan: "Payment Plan",
  hardship_review: "Hardship Review",
  phone_call: "Phone Call",
  sms_reminder: "SMS Reminder",
  email_reminder: "Email Reminder",
  collections_referral: "Collections Referral",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  executed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const OUTCOME_STYLES: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  paid_in_full: { label: "Paid in Full", color: "text-emerald-400", icon: CheckCircle },
  partial_payment: { label: "Partial Payment", color: "text-blue-400", icon: TrendingUp },
  promise_to_pay: { label: "Promise to Pay", color: "text-blue-400", icon: ThumbsUp },
  accepted: { label: "Accepted", color: "text-emerald-400", icon: CheckCircle },
  no_response: { label: "No Response", color: "text-gray-400", icon: XCircle },
  rejected: { label: "Rejected", color: "text-red-400", icon: XCircle },
};

type Tab = "recommendations" | "history";

export default function RecoveryPage() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recommendations");
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/recovery");
      const json = await res.json();
      setData(json);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredRecs = (data?.recommendations ?? []).filter(
    (r) => filter === "all" || r.status === filter
  );

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Recovery
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main recommendation detail */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recovery Recommendation</p>
                    <CardTitle className="text-xl">{selected.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[selected.status]}`}>
                      {selected.status}
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary">
                      Priority {selected.priorityScore}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</p>
                    <p className="text-2xl font-bold text-primary mt-1">{Math.round(selected.confidenceScore * 100)}%</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expected Recovery</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(selected.expectedRecovery)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Action Type</p>
                    <p className="text-sm font-bold text-foreground mt-1">{ACTION_LABELS[selected.action] ?? selected.action}</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>AI Confidence Score</span>
                    <span className="font-medium text-foreground">{Math.round(selected.confidenceScore * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${selected.confidenceScore * 100}%`,
                        background: selected.confidenceScore >= 0.85 ? "#10b981" : selected.confidenceScore >= 0.7 ? "#3b82f6" : "#f59e0b",
                      }}
                    />
                  </div>
                </div>

                {/* Rationale */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">AI Rationale</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.rationale}</p>
                </div>

                {/* Model signals */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Model Signals</p>
                  <div className="space-y-2">
                    {selected.modelSignals.map((signal, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <p className="text-xs text-foreground">{signal}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button variant="gradient" size="sm" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Approve & Execute
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">Generated {formatDateTime(selected.generatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Loan context */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Loan Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Borrower</p>
                  <p className="text-sm font-bold text-foreground mt-1">{selected.borrower.company}</p>
                  <p className="text-xs text-muted-foreground">{selected.borrower.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Loan</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">{selected.loan.number}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-2.5">
                    <p className="text-[10px] text-muted-foreground">Outstanding</p>
                    <p className="text-xs font-bold text-foreground mt-1">{formatCurrency(selected.loan.outstanding)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/10 p-2.5">
                    <p className="text-[10px] text-muted-foreground">Days Overdue</p>
                    <p className="text-xs font-bold text-red-400 mt-1">{selected.loan.daysOverdue} DPD</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Risk Level</p>
                  <StatusBadge status={selected.loan.riskLevel} type="risk" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery"
        description="AI-powered recovery recommendations for your portfolio — refreshes every 10 seconds"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
          <button onClick={fetchData} className="ml-1 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors" aria-label="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{loading ? "—" : data?.stats.pending}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{loading ? "—" : data?.stats.approved}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Executed</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{loading ? "—" : data?.stats.executed}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Expected Recovery</p>
          </div>
          <p className="text-2xl font-bold text-primary">{loading ? "—" : formatCurrency(data?.stats.totalExpectedRecovery ?? 0)}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border/50">
        <button
          onClick={() => setTab("recommendations")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "recommendations" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-4 w-4" />
          Recommendations
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === "history" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <History className="h-4 w-4" />
          History
        </button>
      </div>

      {tab === "recommendations" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>AI Recovery Recommendations</CardTitle>
                <CardDescription>Ranked by priority score — click to view full rationale</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {["all", "pending", "approved", "executed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors ${filter === f ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRecs.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => setSelected(rec)}
                  className="w-full text-left rounded-xl border border-border/50 p-4 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[rec.status]}`}>
                          {rec.status}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                          Priority {rec.priorityScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{ACTION_LABELS[rec.action] ?? rec.action}</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.borrower.company} · {rec.loan.number}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-primary font-medium">{Math.round(rec.confidenceScore * 100)}% confidence</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(rec.expectedRecovery)} expected</span>
                        {rec.loan.daysOverdue > 0 && (
                          <span className="text-red-400">{rec.loan.daysOverdue} DPD</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={rec.loan.riskLevel} type="risk" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
              {filteredRecs.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No recommendations match the selected filter.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recommendation History
            </CardTitle>
            <CardDescription>Past recovery actions and their outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.history ?? []).map((h) => {
                const outcome = OUTCOME_STYLES[h.outcome] ?? { label: h.outcome, color: "text-muted-foreground", icon: Clock };
                const OutcomeIcon = outcome.icon;
                return (
                  <div key={h.id} className="rounded-xl border border-border/50 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.borrower}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <OutcomeIcon className={`h-4 w-4 ${outcome.color}`} />
                        <span className={`text-xs font-semibold ${outcome.color}`}>{outcome.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{h.notes}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ACTION_LABELS[h.action] ?? h.action}</span>
                      <div className="flex items-center gap-3">
                        {h.recoveredAmount > 0 && (
                          <span className="text-emerald-400 font-semibold">{formatCurrency(h.recoveredAmount)} recovered</span>
                        )}
                        <span>{formatDateTime(h.executedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
