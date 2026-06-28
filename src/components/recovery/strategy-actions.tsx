"use client";

/**
 * StrategyActions — wires the Approve / Approve & Execute / Reject buttons
 * on the recovery detail page to PATCH /api/ai/strategy/[id].
 *
 * Pure DB-backed review flow (no Bedrock). After a successful update it
 * reflects the new status locally and refreshes server data.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Action = "approve" | "reject" | "execute";

interface StrategyActionsProps {
  strategyId: string;
  lenderId: string;
  initialStatus: string;
}

const ACTIONABLE = new Set(["pending", "draft"]);

export function StrategyActions({
  strategyId,
  lenderId,
  initialStatus,
}: StrategyActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/ai/strategy/${strategyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lenderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus(data.strategy.status as string);
      // Refresh server components so the status badge / details update too.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPending(null);
    }
  }

  if (!ACTIONABLE.has(status)) {
    return (
      <p className="text-sm text-muted-foreground">
        This recommendation is{" "}
        <span className="font-medium capitalize">{status}</span> — no further
        action available.
      </p>
    );
  }

  const busy = pending !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => run("approve")} disabled={busy}>
          {pending === "approve" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => run("execute")}
          disabled={busy}
        >
          {pending === "execute" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Approve &amp; Execute
        </Button>
        <Button
          variant="outline"
          onClick={() => run("reject")}
          disabled={busy}
        >
          {pending === "reject" ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          Reject
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
