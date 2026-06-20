import {
  RDSDataClient,
  ExecuteStatementCommand,
  BeginTransactionCommand,
  CommitTransactionCommand,
  RollbackTransactionCommand,
} from "@aws-sdk/client-rds-data";

const REGION = process.env.AWS_REGION || "eu-west-2";

export const config = {
  region: REGION,
  clusterArn: process.env.AURORA_CLUSTER_ARN,
  database: process.env.AURORA_DATABASE || "recoveryai",
};

export const client = new RDSDataClient({ region: REGION });

export function requireEnv() {
  const missing = [];
  if (!config.clusterArn) missing.push("AURORA_CLUSTER_ARN");
  if (!config.database) missing.push("AURORA_DATABASE");
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const RESUME_ERRORS = [
  "DatabaseResumingException",
  "is resuming after being auto-paused",
  "Communications link failure",
  "Connection reset",
];

function isResuming(err) {
  const name = err?.name ?? "";
  const msg = err?.message ?? "";
  return RESUME_ERRORS.some((p) => name.includes(p) || msg.includes(p));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Execute one SQL statement via the Data API.
 * Retries automatically while the cluster resumes from scale-to-zero.
 *
 * @param {string} sql
 * @param {object} [opts]
 * @param {string} [opts.secretArn]      secret to authenticate as (master or app_user)
 * @param {string} [opts.transactionId]  run inside an existing transaction
 */
export async function exec(sql, opts = {}) {
  const secretArn = opts.secretArn;
  if (!secretArn) throw new Error("exec() requires a secretArn");

  const input = {
    resourceArn: config.clusterArn,
    secretArn,
    database: config.database,
    sql,
  };
  if (opts.transactionId) input.transactionId = opts.transactionId;

  let attempt = 0;
  const maxAttempts = 12;
  while (true) {
    try {
      return await client.send(new ExecuteStatementCommand(input));
    } catch (err) {
      attempt += 1;
      if (isResuming(err) && attempt < maxAttempts) {
        const wait = Math.min(2000 * attempt, 10000);
        process.stdout.write(
          `\n  cluster is resuming from idle… retry ${attempt}/${maxAttempts} in ${wait / 1000}s`,
        );
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

export async function beginTransaction(secretArn) {
  const res = await client.send(
    new BeginTransactionCommand({
      resourceArn: config.clusterArn,
      secretArn,
      database: config.database,
    }),
  );
  return res.transactionId;
}

export async function commitTransaction(secretArn, transactionId) {
  await client.send(
    new CommitTransactionCommand({
      resourceArn: config.clusterArn,
      secretArn,
      transactionId,
    }),
  );
}

export async function rollbackTransaction(secretArn, transactionId) {
  await client.send(
    new RollbackTransactionCommand({
      resourceArn: config.clusterArn,
      secretArn,
      transactionId,
    }),
  );
}
