/**
 * ============================================================
 * DEMO ONLY — aurora-ping route
 * ============================================================
 * Purpose: Demonstrate the full Vercel → RDS Data API → Aurora
 *          pipeline. Wakes Aurora from 0 ACU and returns the
 *          server timestamp to prove the round-trip works.
 *
 * THIS FILE IS NOT PART OF THE REAL APPLICATION.
 * Replace with real API routes from:
 *   - backend/src/handlers/risk-score.js
 *   - backend/src/handlers/generate-strategy.js
 *   - backend/src/handlers/get-strategies.js
 * following MIGRATION.md Step 5.
 * ============================================================
 */

import { NextResponse } from "next/server";
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

/**
 * RDS Data API client.
 *
 * On Vercel production the SDK automatically picks up credentials
 * from the OIDC-federated role (AWS_ROLE_ARN env var set in Vercel
 * dashboard). No static keys are used — see infra/lib/track2-stack.ts.
 *
 * DEMO NOTE: In the real app this client lives in
 * src/services/aurora/AuroraDataRepository.ts (MIGRATION.md Step 4).
 */
const rdsClient = new RDSDataClient({
  region: process.env.AWS_REGION ?? "eu-west-2",
});

export async function GET() {
  const resourceArn = process.env.AURORA_CLUSTER_ARN;
  const secretArn = process.env.AURORA_SECRET_ARN;
  const database = process.env.AURORA_DATABASE ?? "recoveryai";

  // Guard: env vars must be present (set in Vercel dashboard)
  if (!resourceArn || !secretArn) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AURORA_CLUSTER_ARN and AURORA_SECRET_ARN are not set. " +
          "Add them in Vercel Dashboard → Project → Settings → Environment Variables.",
      },
      { status: 503 }
    );
  }

  const startedAt = Date.now();

  try {
    /**
     * Simple ping query — just enough to wake Aurora from 0 ACU
     * and confirm the full pipeline is working.
     *
     * Aurora Serverless v2 at 0 ACU will resume on this request.
     * Cold start is typically 15–30 seconds — the frontend spinner
     * stays visible until this resolves.
     *
     * DEMO NOTE: In the real app queries are run via the query()
     * helper in src/services/aurora/AuroraDataRepository.ts.
     */
    const command = new ExecuteStatementCommand({
      resourceArn,
      secretArn,
      database,
      sql: "SELECT NOW() AS server_time, current_database() AS database_name",
      includeResultMetadata: true,
    });

    const response = await rdsClient.send(command);

    const row = response.records?.[0];
    const serverTime = row?.[0]?.stringValue ?? "unknown";
    const databaseName = row?.[1]?.stringValue ?? "unknown";
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      message: "Aurora is awake and responding.",
      serverTime,
      databaseName,
      elapsedMs,
      coldStart: elapsedMs > 5000, // flag if it took > 5s (likely woke from 0 ACU)
    });
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
        elapsedMs,
      },
      { status: 500 }
    );
  }
}
