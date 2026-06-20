/**
 * ============================================================
 * DEMO ONLY — aurora-ping route
 * ============================================================
 * Purpose: Demonstrate the full Vercel → RDS Data API → Aurora
 *          pipeline. Wakes Aurora from 0 ACU and returns the
 *          server timestamp to prove the round-trip works.
 *
 * THIS FILE IS NOT PART OF THE REAL APPLICATION.
 * Replace with real API routes from backend handlers following
 * MIGRATION.md Step 5.
 * ============================================================
 *
 * Response codes:
 *   200 — Aurora is awake, query succeeded
 *   202 — Aurora is still resuming from 0 ACU, client should retry
 *   503 — env vars not configured
 *   500 — unexpected error
 */

import { NextResponse } from "next/server";
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";

const rdsClient = new RDSDataClient({
  region: process.env.AWS_REGION ?? "eu-west-2",
});

/** RDS error message fragment Aurora sends when resuming from 0 ACU */
const RESUMING_FRAGMENT = "is resuming after being auto-paused";

export async function GET() {
  const resourceArn = process.env.AURORA_CLUSTER_ARN;
  const secretArn   = process.env.AURORA_SECRET_ARN;
  const database    = process.env.AURORA_DATABASE ?? "recoveryai";

  if (!resourceArn || !secretArn) {
    return NextResponse.json(
      {
        ok: false,
        waking: false,
        error:
          "AURORA_CLUSTER_ARN and AURORA_SECRET_ARN are not set. " +
          "Add them in Vercel Dashboard → Project → Settings → Environment Variables.",
      },
      { status: 503 }
    );
  }

  const startedAt = Date.now();

  try {
    const command = new ExecuteStatementCommand({
      resourceArn,
      secretArn,
      database,
      sql: "SELECT NOW() AS server_time, current_database() AS database_name",
      includeResultMetadata: true,
    });

    const response = await rdsClient.send(command);
    const row = response.records?.[0];
    const serverTime    = row?.[0]?.stringValue ?? "unknown";
    const databaseName  = row?.[1]?.stringValue ?? "unknown";
    const elapsedMs     = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      waking: false,
      message: "Aurora is awake and responding.",
      serverTime,
      databaseName,
      elapsedMs,
    });

  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message   = error instanceof Error ? error.message : "Unknown error";

    // Aurora is resuming from 0 ACU — not a real error, just needs time
    if (message.includes(RESUMING_FRAGMENT)) {
      return NextResponse.json(
        { ok: false, waking: true, message: "Aurora is resuming from 0 ACU.", elapsedMs },
        { status: 202 }
      );
    }

    return NextResponse.json(
      { ok: false, waking: false, error: message, elapsedMs },
      { status: 500 }
    );
  }
}
