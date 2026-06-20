/**
 * ============================================================
 * DEMO ONLY — Aurora Pipeline Demo Page
 * ============================================================
 * Demonstrates: Browser → Next.js API Route → RDS Data API → Aurora
 *
 * THIS PAGE IS NOT PART OF THE REAL APPLICATION.
 * Remove once real AuroraDataRepository is wired in (MIGRATION.md Step 4)
 * ============================================================
 */

"use client";

import { useState, useRef } from "react";
import { Database, Sun, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "waking" | "loading" | "success" | "error";

interface PingResult {
  ok: boolean;
  waking?: boolean;
  message?: string;
  serverTime?: string;
  databaseName?: string;
  elapsedMs?: number;
  error?: string;
}

/** Exponential backoff config */
const INITIAL_DELAY_MS  = 3000;   // wait 3s before first retry
const MAX_DELAY_MS      = 15000;  // cap at 15s between retries
const MAX_ATTEMPTS      = 12;     // ~2 min total before giving up

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuroraDemoPage() {
  const [status, setStatus]         = useState<Status>("idle");
  const [result, setResult]         = useState<PingResult | null>(null);
  const [attempt, setAttempt]       = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const startTimeRef                = useRef<number>(0);
  const abortRef                    = useRef(false);

  async function handlePing() {
    abortRef.current = false;
    startTimeRef.current = Date.now();
    setStatus("loading");
    setResult(null);
    setAttempt(0);
    setElapsed(0);

    let delay = INITIAL_DELAY_MS;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      if (abortRef.current) return;

      setAttempt(i);

      try {
        const res  = await fetch("/api/demo/aurora-ping");
        const data: PingResult = await res.json();
        const totalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsed(totalElapsed);

        if (res.status === 200 && data.ok) {
          setStatus("success");
          setResult(data);
          return;
        }

        if (res.status === 202 && data.waking) {
          // Aurora is resuming — switch to waking state and retry
          setStatus("waking");
          if (i < MAX_ATTEMPTS) {
            await sleep(delay);
            delay = Math.min(delay * 1.5, MAX_DELAY_MS);
          }
          continue;
        }

        // Real error — stop retrying
        setStatus("error");
        setResult(data);
        return;

      } catch {
        setStatus("error");
        setResult({ ok: false, error: "Network error — could not reach the API route." });
        return;
      }
    }

    // Exceeded max attempts
    setStatus("error");
    setResult({
      ok: false,
      error: `Aurora did not respond after ${MAX_ATTEMPTS} attempts (~2 min). ` +
             "Check the AWS console — the cluster may need manual intervention.",
    });
  }

  function handleCancel() {
    abortRef.current = true;
    setStatus("idle");
    setResult(null);
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 p-8">

      {/* Demo badge */}
      <div className="rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-4 py-1 tracking-wide uppercase">
        Demo Pipeline — Remove after migration
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Database className="h-5 w-5" />
          <span className="text-sm">Browser → API Route → RDS Data API → Aurora Serverless v2</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Aurora Pipeline Demo</h1>
        <p className="text-muted-foreground max-w-md">
          Aurora is currently at <strong>0 ACU</strong> (sleeping). Clicking the button
          will wake it, run a <code className="text-xs bg-muted px-1 py-0.5 rounded">SELECT NOW()</code>,
          and return the result. Expect a <strong>15–60 second cold start</strong>.
        </p>
      </div>

      {/* Button */}
      {(status === "idle" || status === "success" || status === "error") && (
        <button
          onClick={handlePing}
          className="
            inline-flex items-center gap-3 px-8 py-4 rounded-xl
            bg-primary text-primary-foreground font-semibold text-lg
            hover:bg-primary/90 active:scale-95
            transition-all duration-150 shadow-lg hover:shadow-xl
          "
        >
          <Sun className="h-6 w-6" />
          {status === "idle" ? "Good Morning Aurora ☀️" : "Try Again"}
        </button>
      )}

      {/* ── LOADING state: first ping sent, waiting for response ── */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Pinging Aurora…</p>
          <button onClick={handleCancel} className="text-xs text-muted-foreground underline">
            Cancel
          </button>
        </div>
      )}

      {/* ── WAKING state: Aurora is resuming, retrying with backoff ── */}
      {status === "waking" && (
        <div className="flex flex-col items-center gap-5 max-w-sm text-center">

          {/* Sun rising animation */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-30" />
            <div className="absolute inset-2 rounded-full bg-amber-200 animate-pulse opacity-50" />
            <Sun className="relative h-12 w-12 text-amber-500 animate-spin [animation-duration:4s]" />
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-amber-700">Aurora is waking up ☀️</p>
            <p className="text-sm text-muted-foreground">
              Resuming from 0 ACU — this takes 15–60 seconds.
              Retrying automatically…
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(attempt, 8) }).map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400"
                style={{ opacity: 0.4 + (i / 8) * 0.6 }}
              />
            ))}
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
          </div>

          <p className="text-xs text-muted-foreground">
            Attempt {attempt} · {elapsed}s elapsed
          </p>

          <button onClick={handleCancel} className="text-xs text-muted-foreground underline">
            Cancel
          </button>
        </div>
      )}

      {/* ── SUCCESS state ── */}
      {status === "success" && result && (
        <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Aurora is awake and responding
          </div>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Server time</dt>
              <dd className="font-mono font-medium">{result.serverTime}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Database</dt>
              <dd className="font-mono font-medium">{result.databaseName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total time</dt>
              <dd className="font-mono font-medium">{elapsed}s</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Attempts</dt>
              <dd className="font-mono font-medium">{attempt}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground pt-1 border-t border-emerald-200">
            Full pipeline confirmed: Vercel → Next.js API Route → RDS Data API → Aurora ✓
          </p>
        </div>
      )}

      {/* ── ERROR state ── */}
      {status === "error" && result && (
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Aurora did not respond
          </div>
          <p className="text-sm text-red-600 font-mono break-all">{result.error}</p>
          <p className="text-xs text-muted-foreground pt-1 border-t border-red-200">
            Check that AURORA_CLUSTER_ARN and AURORA_SECRET_ARN are set and the
            Vercel OIDC role is deployed (infra/).
          </p>
        </div>
      )}

    </div>
  );
}
