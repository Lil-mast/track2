"use client";

/**
 * LoanStrategies — live consumer of GET /api/ai/strategies/[loanId].
 *
 * Demonstrates the browser → API route → RDS Data API → Aurora read path:
 * fetches every AI-generated recovery strategy for a loan and renders the
 * full plan. Tenant-scoped by lenderId (passed from the server component).
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

export function LoanStrategies({ loanId, lenderId }: LoanStrategiesProps) {
  const [strategies, setStrategies] = useState<StrategyRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          aria-label="Refresh strategies"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading strategies from Aurora…
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
