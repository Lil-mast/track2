"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { warmupDatabase } from "@/lib/warmup-database";

const LOADING_MESSAGES = [
  "Loading application...",
  "Starting database...",
  "This can take up to 30 seconds after a period of inactivity.",
] as const;

type GateState = "loading" | "ready" | "error";

export function DatabaseWarmupGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GateState>("loading");
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runWarmup() {
      try {
        await warmupDatabase();
        if (!cancelled) {
          setState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not connect to the database."
          );
        }
      }
    }

    void runWarmup();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state !== "loading") return;

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [state]);

  if (state === "ready") {
    return children;
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Database unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage ??
              "The database is still starting. Please try again in a moment."}
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-base font-medium">
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Waking Aurora after inactivity. Subsequent loads should be faster.
        </p>
      </div>
    </div>
  );
}
