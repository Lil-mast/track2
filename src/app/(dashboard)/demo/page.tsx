/**
 * ============================================================
 * DEMO ONLY — Aurora Pipeline Demo Page
 * ============================================================
 * Purpose: Demonstrate the full pipeline:
 *   Browser → Next.js API Route → RDS Data API → Aurora (0 ACU)
 *             ← JSON response    ← SQL result  ← resumes
 *
 * Shows a "Good Morning Aurora ☀️" button, a spinner while
 * Aurora wakes from 0 ACU (15–30s cold start), then displays
 * the server timestamp returned from the database.
 *
 * THIS PAGE IS NOT PART OF THE REAL APPLICATION.
 * It exists solely to prove the Vercel → Aurora pipeline works
 * end-to-end on the migration branch. Remove it once the real
 * AuroraDataRepository (MIGRATION.md Step 4) is wired in.
 * ============================================================
 */

"use client";

import { useState } from "react";
import { Database, Sun, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

interface PingResult {
  ok: boolean;
  message?: string;
  serverTime?: string;
  databaseName?: string;
  elapsedMs?: number;
  coldStart?: boolean;
  error?: string;
}

export default function AuroraDemoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PingResult | null>(null);

  async function handlePing() {
    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch("/api/demo/aurora-ping");
      const data: PingResult = await res.json();

      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
      setResult(data);
    } catch {
      setStatus("error");
      setResult({ ok: false, error: "Network error — could not reach the API route." });
    }
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
          and return the result. Expect a <strong>15–30 second cold start</strong>.
        </p>
      </div>

      {/* Button */}
      <button
        onClick={handlePing}
        disabled={status === "loading"}
        className="
          inline-flex items-center gap-3 px-8 py-4 rounded-xl
          bg-primary text-primary-foreground font-semibold text-lg
          hover:bg-primary/90 active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-150 shadow-lg hover:shadow-xl
        "
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            Waking Aurora…
          </>
        ) : (
          <>
            <Sun className="h-6 w-6" />
            Good Morning Aurora ☀️
          </>
        )}
      </button>

      {/* Spinner state */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <p className="text-sm">Aurora is resuming from 0 ACU — this may take up to 30 seconds.</p>
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Success result */}
      {status === "success" && result && (
        <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Aurora responded successfully
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
              <dt className="text-muted-foreground">Round-trip</dt>
              <dd className="font-mono font-medium">
                {((result.elapsedMs ?? 0) / 1000).toFixed(1)}s
                {result.coldStart && (
                  <span className="ml-2 text-amber-600 text-xs">(cold start)</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground pt-1 border-t border-emerald-200">
            Full pipeline confirmed: Vercel → Next.js API Route → RDS Data API → Aurora ✓
          </p>
        </div>
      )}

      {/* Error result */}
      {status === "error" && result && (
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Aurora did not respond
          </div>
          <p className="text-sm text-red-600 font-mono break-all">{result.error}</p>
          <p className="text-xs text-muted-foreground pt-1 border-t border-red-200">
            Check that AURORA_CLUSTER_ARN and AURORA_SECRET_ARN are set in the
            Vercel Dashboard and that the Vercel OIDC role is deployed (infra/).
          </p>
        </div>
      )}

    </div>
  );
}
