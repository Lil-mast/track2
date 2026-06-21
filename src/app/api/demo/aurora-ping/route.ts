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
 * CREDENTIALS — two environments, two mechanisms:
 *
 *   On Vercel:  there are NO static AWS keys. Vercel issues an OIDC
 *               token per request; we exchange it for temporary AWS
 *               credentials by assuming AWS_ROLE_ARN. This is done by
 *               awsCredentialsProvider() from @vercel/functions/oidc.
 *               Requires OIDC enabled in Vercel project settings AND
 *               the CDK trust policy to match this deployment's
 *               project + environment (see infra/lib/track2-stack.ts).
 *
 *   Locally:    AWS_ROLE_ARN is not set, so we fall back to the SDK
 *               default credential chain (your ~/.aws/credentials).
 *
 * Response codes:
 *   200 — Aurora is awake, query succeeded
 *   202 — Aurora is still resuming from 0 ACU, client should retry
 *   503 — env vars not configured
 *   500 — unexpected error (e.g. credentials / role assumption failed)
 */

import { NextResponse } from "next/server";
import {
  RDSDataClient,
  ExecuteStatementCommand,
} from "@aws-sdk/client-rds-data";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

/** RDS error message fragment Aurora sends when resuming from 0 ACU */
const RESUMING_FRAGMENT = "is resuming after being auto-paused";

/**
 * Build an RDS Data API client appropriate for the runtime environment.
 *  - Vercel (AWS_ROLE_ARN set): assume the role via Vercel OIDC token
 *  - Local (no AWS_ROLE_ARN):   use the default credential chain
 */
function buildClient(): RDSDataClient {
  const region = process.env.AWS_REGION ?? "eu-west-2";
  const roleArn = process.env.AWS_ROLE_ARN;

  if (roleArn) {
    return new RDSDataClient({
      region,
      credentials: awsCredentialsProvider({ roleArn }),
    });
  }

  // Local dev — SDK picks up ~/.aws/credentials
  return new RDSDataClient({ region });
}

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
    const rdsClient = buildClient();

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
