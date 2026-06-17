/**
 * migrate.mjs — apply database/sql/001_schema.sql to the Aurora cluster.
 *
 * Runs the FULL schema + seed data using the MASTER secret (the only role
 * allowed to run DDL). Uses the RDS Data API, so no VPC/network access is
 * needed. Each statement is executed individually (Data API limitation).
 *
 * Required env:
 *   AURORA_CLUSTER_ARN   - from CDK output
 *   AURORA_SECRET_ARN    - the MASTER secret (track2/db-credentials)
 *   AURORA_DATABASE      - recoveryai
 *   AWS_REGION           - eu-west-2 (optional, defaults to eu-west-2)
 *
 * The schema file contains NO secrets, so statements are safe to log on error.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { splitSqlStatements } from "./lib/split-sql.mjs";
import { exec, config, requireEnv } from "./lib/data-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "../../database/sql/001_schema.sql");

const MASTER_SECRET_ARN = process.env.AURORA_SECRET_ARN;

async function main() {
  requireEnv();
  if (!MASTER_SECRET_ARN) {
    console.error("Missing AURORA_SECRET_ARN (must be the MASTER secret for migrations).");
    process.exit(1);
  }

  const sql = readFileSync(SCHEMA_PATH, "utf8");
  const statements = splitSqlStatements(sql);

  console.log(`Applying ${statements.length} statements from 001_schema.sql`);
  console.log(`  cluster:  ${config.clusterArn}`);
  console.log(`  database: ${config.database}\n`);

  let ok = 0;
  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx];
    const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
    try {
      await exec(stmt, { secretArn: MASTER_SECRET_ARN });
      ok += 1;
      process.stdout.write(`\r  [${ok}/${statements.length}] ${preview}`.padEnd(90));
    } catch (err) {
      console.error(`\n\n✗ Failed on statement ${idx + 1}:`);
      console.error(preview);
      console.error(`\nError: ${err.name}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\n\n✓ Schema + seed applied successfully (${ok} statements).`);
}

main().catch((err) => {
  console.error("\nUnexpected error:", err);
  process.exit(1);
});
