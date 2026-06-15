const DEFAULT_MAX_ATTEMPTS = 8;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;
const REQUEST_TIMEOUT_MS = 35000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type WarmupResult = {
  mode: "mock" | "aurora";
};

export async function warmupDatabase(options?: {
  maxAttempts?: number;
}): Promise<WarmupResult> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let delay = INITIAL_DELAY_MS;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        const body = (await response.json()) as WarmupResult & { status?: string };
        return { mode: body.mode ?? "mock" };
      }

      lastError = new Error(`Health check failed with status ${response.status}`);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Health check request failed");
    }

    if (attempt < maxAttempts) {
      await sleep(delay);
      delay = Math.min(delay * 2, MAX_DELAY_MS);
    }
  }

  throw lastError ?? new Error("Database warmup failed");
}
