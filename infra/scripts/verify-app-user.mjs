/**
 * verify-app-user.mjs — prove the app_user role is read/write ONLY.
 *
 * Authenticates to the Data API AS app_user (using the app-user secret) and:
 *   1. SELECT            → must SUCCEED (read)
 *   2. INSERT/UPDATE/DELETE inside a transaction, then ROLLBACK
 *                        → must SUCCEED (write, nothing persisted)
 *   3. CREATE TABLE      → must FAIL with permission denied (no DDL)
 *   4. DROP TABLE        → must FAIL with permission denied (no DDL)
 *
 * Exits non-zero if any expectation is violated.
 *
 * Required env:
 *   AURORA_CLUSTER_ARN
 *   APP_USER_SECRET_ARN   - the app-user secret
 *   AURORA_DATABASE
 */
import {
  exec,
  beginTransaction,
  rollbackTransaction,
  requireEnv,
} from "./lib/data-api.mjs";

const APP_USER_SECRET_ARN = process.env.APP_USER_SECRET_ARN;

// A known seed row (demo lender) for a valid FK on the write test.
const DEMO_USER_ID = "b0000001-0000-0000-0000-000000000001";

function isPermissionDenied(err) {
  const msg = `${err?.name ?? ""} ${err?.message ?? ""}`.toLowerCase();
  return msg.includes("permission denied") || msg.includes("must be owner");
}

async function main() {
  requireEnv();
  if (!APP_USER_SECRET_ARN) {
    console.error("Missing APP_USER_SECRET_ARN (the app-user secret).");
    process.exit(1);
  }
  const secretArn = APP_USER_SECRET_ARN;

  let failures = 0;
  const pass = (m) => console.log(`  ✓ ${m}`);
  const fail = (m) => {
    console.error(`  ✗ ${m}`);
    failures += 1;
  };

  console.log("Verifying app_user privileges (connecting AS app_user)\n");

  // 1. READ
  try {
    const res = await exec("SELECT COUNT(*) AS c FROM users;", { secretArn });
    const count = res.records?.[0]?.[0]?.longValue ?? "?";
    pass(`READ allowed — SELECT on users returned ${count} rows`);
  } catch (err) {
    fail(`READ failed unexpectedly: ${err.name}: ${err.message}`);
  }

  // 2. WRITE (inside a transaction, rolled back so nothing persists)
  let txn;
  try {
    txn = await beginTransaction(secretArn);
    await exec(
      `INSERT INTO notifications (user_id, type, title, body)
       VALUES ('${DEMO_USER_ID}', 'loan_created', '__perm_test__', '__perm_test__');`,
      { secretArn, transactionId: txn },
    );
    await exec(
      `UPDATE notifications SET read = TRUE WHERE title = '__perm_test__';`,
      { secretArn, transactionId: txn },
    );
    await exec(
      `DELETE FROM notifications WHERE title = '__perm_test__';`,
      { secretArn, transactionId: txn },
    );
    await rollbackTransaction(secretArn, txn);
    pass("WRITE allowed — INSERT/UPDATE/DELETE succeeded (rolled back, no data persisted)");
  } catch (err) {
    if (txn) {
      try { await rollbackTransaction(secretArn, txn); } catch { /* ignore */ }
    }
    fail(`WRITE failed unexpectedly: ${err.name}: ${err.message}`);
  }

  // 3. DDL: CREATE TABLE must be denied
  try {
    await exec("CREATE TABLE __perm_check__ (id int);", { secretArn });
    fail("DDL CREATE TABLE was ALLOWED — app_user has too much privilege!");
    // cleanup just in case it somehow succeeded
    try { await exec("DROP TABLE __perm_check__;", { secretArn }); } catch { /* ignore */ }
  } catch (err) {
    if (isPermissionDenied(err)) {
      pass("DDL blocked — CREATE TABLE correctly denied (permission denied)");
    } else {
      fail(`CREATE TABLE failed but not with permission-denied: ${err.name}: ${err.message}`);
    }
  }

  // 4. DDL: DROP TABLE must be denied
  try {
    await exec("DROP TABLE users;", { secretArn });
    fail("DDL DROP TABLE was ALLOWED — app_user can destroy tables!");
  } catch (err) {
    if (isPermissionDenied(err)) {
      pass("DDL blocked — DROP TABLE correctly denied (permission denied)");
    } else {
      fail(`DROP TABLE failed but not with permission-denied: ${err.name}: ${err.message}`);
    }
  }

  console.log("");
  if (failures === 0) {
    console.log("✓ CONFIRMED: app_user is READ/WRITE only (no DDL, no schema changes).");
    process.exit(0);
  } else {
    console.error(`✗ ${failures} check(s) failed — review app_user privileges.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nVerification error:", err);
  process.exit(1);
});
