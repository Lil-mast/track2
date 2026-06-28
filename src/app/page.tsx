"use client";

/**
 * Root entry point (/) — Aurora wake-up gate.
 *
 * On load this page automatically pings the Aurora pipeline
 * (Browser → /api/demo/aurora-ping → RDS Data API → Aurora). Aurora
 * Serverless v2 scales to 0 ACU when idle, so the first request may take
 * 15–60s to resume. We poll with exponential backoff while it wakes, then
 * redirect straight to /dashboard once the database responds.
 *
 * No button — the wake-up starts the moment someone hits the site.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Sun, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "waking" | "success" | "error";

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
const INITIAL_DELAY_MS = 3000; // wait 3s before first retry
const MAX_DELAY_MS = 15000; // cap at 15s between retries
const MAX_ATTEMPTS = 12; // ~2 min total before giving up

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HomePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Guard against React Strict Mode double-invocation in development.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const startTime = Date.now();

    async function wakeAurora() {
      let delay = INITIAL_DELAY_MS;

      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        setAttempt(i);

        try {
          const res = await fetch("/api/demo/aurora-ping");
          const data: PingResult = await res.json();
          setElapsed(Math.round((Date.now() - startTime) / 1000));

          if (res.status === 200 && data.ok) {
            setStatus("success");
            // Aurora is awake — go to the dashboard.
            router.replace("/dashboard");
            return;
          }

          if (res.status === 202 && data.waking) {
            setStatus("waking");
            if (i < MAX_ATTEMPTS) {
              await sleep(delay);
              delay = Math.min(delay * 1.5, MAX_DELAY_MS);
            }
            continue;
          }

          // Real error — stop retrying.
          setStatus("error");
          setErrorMsg(data.error ?? "Aurora returned an unexpected response.");
          return;
        } catch {
          setStatus("error");
          setErrorMsg("Network error — could not reach the API route.");
          return;
        }
      }

      setStatus("error");
      setErrorMsg(
        `Aurora did not respond after ${MAX_ATTEMPTS} attempts (~2 min). ` +
          "Please refresh to try again."
      );
    }

    wakeAurora();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-[#030712] text-white">
      <div className="flex items-center justify-center gap-2 text-white/60">
        <Database className="h-5 w-5" />
        <span className="text-sm">RecoverIQ · connecting to Aurora</span>
      </div>

      {/* Waking / loading animation */}
      <div className="relative flex items-center justify-center w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
        <div className="absolute inset-3 rounded-full bg-amber-500/30 animate-pulse" />
        {status === "error" ? (
          <AlertCircle className="relative h-14 w-14 text-red-400" />
        ) : status === "success" ? (
          <Loader2 className="relative h-14 w-14 text-emerald-400 animate-spin" />
        ) : (
          <Sun className="relative h-14 w-14 text-amber-400 animate-spin [animation-duration:4s]" />
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-2 max-w-md">
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-semibold">Starting up…</h1>
            <p className="text-white/60 text-sm">Reaching the database.</p>
          </>
        )}

        {status === "waking" && (
          <>
            <h1 className="text-2xl font-semibold text-amber-300">
              Waking Aurora ☀️
            </h1>
            <p className="text-white/60 text-sm">
              The database is resuming from idle — this takes 15–60 seconds.
              You&apos;ll be redirected automatically.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-semibold text-emerald-300">
              Connected ✓
            </h1>
            <p className="text-white/60 text-sm">Loading your dashboard…</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-semibold text-red-300">
              Could not reach the database
            </h1>
            <p className="text-white/60 text-sm font-mono break-words">
              {errorMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </>
        )}
      </div>

      {/* Progress indicator while waking */}
      {(status === "waking" || status === "loading") && (
        <p className="text-xs text-white/40">
          Attempt {attempt} · {elapsed}s elapsed
        </p>
      )}
    </main>
  );
}
