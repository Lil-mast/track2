"use client";

/**
 * LoanStrategies — live consumer of GET /api/ai/strategies/[loanId].
 *
 * Fetches AI-generated recovery strategies for a loan from Convex via API route.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Raw strategy row shape returned by the API (snake_case from Postgres). */
interface StrategyRow {
  id: string;
  status: string;
  content: string;
  summary: string | null;
  recommended_action: string | null;
  recovery_action: string | null;
  confidence_score: string | number | null;
  risk_score_at_creation: string | number | null;
  expected_recovery_amount: string | number | null;
  model_id: string | null;
  created_at: string;
}

interface LoanStrategiesProps {
  loanId: string;
  lenderId: string;
  borrowerId: string;
}

function pct(value: string | number | null): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n * 100)}%`;
}

function statusClasses(status: string): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "executed":
    case "dispatched":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "expired":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default: // pending / draft
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
}

export function LoanStrategies({
  loanId,
  lenderId,
  borrowerId,
}: LoanStrategiesProps) {
  const [strategies, setStrategies] = useState<StrategyRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "info" | "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ai/strategies/${loanId}?lenderId=${encodeURIComponent(lenderId)}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStrategies(data.strategies as StrategyRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load strategies");
    } finally {
      setLoading(false);
    }
  }, [loanId, lenderId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setNotice(null);
    try {
      // Step 1 — risk score
      const scoreRes = await fetch("/api/ai/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, borrowerId, lenderId }),
      });

      if (scoreRes.status === 503) {
        setNotice({
          kind: "info",
          text: "AI engine is not enabled yet (Bedrock is disabled). Ask the project owner to set BEDROCK_ENABLED before using Analyze.",
        });
        return;
      }

      const scoreData = await scoreRes.json();
      if (!scoreRes.ok || !scoreData.success) {
        throw new Error(scoreData.error ?? `Risk scoring failed (${scoreRes.status})`);
      }

      // Step 2 — generate strategy from the new score
      const stratRes = await fetch("/api/ai/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId,
          riskScore: scoreData.riskScore,
          lenderId,
        }),
      });

      if (stratRes.status === 503) {
        setNotice({
          kind: "info",
          text: "Risk score computed, but strategy generation needs Bedrock (disabled).",
        });
        return;
      }

      const stratData = await stratRes.json();
      if (!stratRes.ok || !stratData.success) {
        throw new Error(
          stratData.error ?? `Strategy generation failed (${stratRes.status})`
        );
      }

      setNotice({
        kind: "success",
        text: `New strategy generated (risk score ${scoreData.riskScore}).`,
      });
      await load(); // refresh the list with the new strategy
    } catch (err) {
      setNotice({
        kind: "error",
        text: err instanceof Error ? err.message : "Analysis failed",
      });
    } finally {
      setAnalyzing(false);
    }
  }, [loanId, borrowerId, lenderId, load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Recovery Strategies
          {strategies && (
            <span className="text-xs font-normal text-muted-foreground">
              ({strategies.length})
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={analyzing || loading}
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Analyze with AI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Refresh strategies"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {notice && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
              notice.kind === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : notice.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">{notice.text}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading strategies…
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {!loading && !error && strategies && strategies.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No AI strategies have been generated for this loan yet.
          </p>
        )}

        {!loading && !error && strategies && strategies.length > 0 && (
          <div className="space-y-4">
            {strategies.map((s) => {
              const confidence = pct(s.confidence_score);
              const risk = s.risk_score_at_creation
                ? Number(s.risk_score_at_creation)
                : null;
              return (
                <div key={s.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {s.recommended_action ?? "Recovery Strategy"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses(s.status)}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {risk !== null && <span>Risk {risk}</span>}
                      {confidence && (
                        <span className="text-primary font-medium">
                          {confidence} confidence
                        </span>
                      )}
                    </div>
                  </div>

                  {s.summary && (
                    <p className="text-sm text-muted-foreground">{s.summary}</p>
                  )}

                  <div className="rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {s.content}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{s.model_id}</span>
                    <Link
                      href={`/recovery/${s.id}`}
                      className="text-primary hover:underline"
                    >
                      Open recommendation →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
