/**
 * create-app-user.mjs — create the least-privilege `app_user` Postgres role.
 *
 * The app_user role is what Vercel uses at runtime. It gets ONLY DML
 * (SELECT/INSERT/UPDATE/DELETE) on the public schema — never DDL, never
 * superuser, never CREATE/DROP. ALTER DEFAULT PRIVILEGES ensures any tables
 * created LATER by the master role are automatically readable/writable by
 * app_user, so you never have to re-grant when the schema grows.
 *
 * Runs as the MASTER role (only the owner can create roles + grant).
 * The app_user password is read from the app-user secret in Secrets Manager
 * and embedded in the CREATE ROLE statement. That statement is NEVER logged.
 *
 * Required env:
 *   AURORA_CLUSTER_ARN    - from CDK output
 *   AURORA_SECRET_ARN     - the MASTER secret (track2/db-credentials)
 *   APP_USER_SECRET_ARN   - the app-user secret (track2/app-user-credentials)
 *   AURORA_DATABASE       - recoveryai
 *   MASTER_DB_USER        - master role name (default: recoveryai_admin)
 */
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { exec, config, requireEnv } from "./lib/data-api.mjs";

const MASTER_SECRET_ARN = process.env.AURORA_SECRET_ARN;
const APP_USER_SECRET_ARN = process.env.APP_USER_SECRET_ARN;
const MASTER_DB_USER = process.env.MASTER_DB_USER || "recoveryai_admin";
const REGION = process.env.AWS_REGION || "eu-west-2";

async function getAppUserCreds() {
  const sm = new SecretsManagerClient({ region: REGION });
  const res = await sm.send(
    new GetSecretValueCommand({ SecretId: APP_USER_SECRET_ARN }),
  );
  const parsed = JSON.parse(res.SecretString);
  if (!parsed.username || !parsed.password) {
    throw new Error("app-user secret is missing username/password");
  }
  return parsed; // { username, password }
}

async function main() {
  requireEnv();
  if (!MASTER_SECRET_ARN || !APP_USER_SECRET_ARN) {
    console.error(
      "Missing AURORA_SECRET_ARN (master) and/or APP_USER_SECRET_ARN (app user).",
    );
    process.exit(1);
  }

  const { username, password } = await getAppUserCreds();
  const db = config.database;

  // The secret password generation excludes quotes/backslashes/special chars,
  // so embedding it in a single-quoted literal is safe. This statement is
  // intentionally NOT logged.
  const createRole = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${username}') THEN
    CREATE ROLE ${username} LOGIN PASSWORD '${password}';
  ELSE
    ALTER ROLE ${username} LOGIN PASSWORD '${password}';
  END IF;
END
$$;`;

  // Each of these is safe to log (no secrets).
  const grants = [
    `GRANT CONNECT ON DATABASE ${db} TO ${username};`,
    `GRANT USAGE ON SCHEMA public TO ${username};`,
    // Explicitly ensure NO object-creation rights in the schema.
    `REVOKE CREATE ON SCHEMA public FROM ${username};`,
    // DML on all CURRENT tables + sequences.
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${username};`,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${username};`,
    // DML on all FUTURE tables + sequences created by the master role.
    // This is the key line: new tables added later are auto-granted.
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${MASTER_DB_USER} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${username};`,
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${MASTER_DB_USER} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${username};`,
  ];

  console.log(`Creating/least-privilege role "${username}" on database "${db}"`);
  console.log(`  master role: ${MASTER_DB_USER}\n`);

  await exec(createRole, { secretArn: MASTER_SECRET_ARN });
  console.log(`  ✓ role "${username}" created/updated (password set from secret)`);

  for (const g of grants) {
    await exec(g, { secretArn: MASTER_SECRET_ARN });
    console.log(`  ✓ ${g.replace(/\s+/g, " ").trim()}`);
  }

  console.log(`\n✓ app_user provisioned with DML-only + future-table defaults.`);
  console.log(`  Run "npm run verify-app-user" to confirm read/write-only access.`);
}

main().catch((err) => {
  console.error("\nFailed to create app_user:", err.name, err.message);
  process.exit(1);
});
