import { mockDataRepository } from "./mock/MockDataRepository";
import { auroraDataRepository } from "./aurora/AuroraDataRepository";
import type { IDataRepository } from "./interfaces/IDataRepository";

/**
 * Data access layer entry point.
 *
 * Selects Aurora automatically — no `AURORA_ENABLED` flag required — using the
 * same contract the working `/demo` pipeline relies on: Aurora is used whenever
 * the deployment can actually reach it.
 *
 * Resolution order:
 *   1. Explicit override: AURORA_ENABLED=true  -> Aurora (kept for back-compat).
 *   2. Explicit override: AURORA_ENABLED=false -> mock (escape hatch).
 *   3. On Vercel, credentials are obtained via OIDC role assumption, so the
 *      presence of AWS_ROLE_ARN together with the Aurora connection ARNs means
 *      the runtime can authenticate to Aurora -> Aurora.
 *   4. Otherwise (e.g. local dev with no AWS_ROLE_ARN) -> mock data.
 *
 * This keeps local development on mock data (where the OIDC-locked IAM role is
 * not assumable) while the deployed app uses the real seeded database.
 */
export function getDataRepository(): IDataRepository {
  // Explicit overrides win, in both directions.
  if (process.env.AURORA_ENABLED === "true") {
    return auroraDataRepository;
  }
  if (process.env.AURORA_ENABLED === "false") {
    return mockDataRepository;
  }

  // Auto-detect: a runtime that has the OIDC role plus the Aurora connection
  // details (the same env the /demo route uses) can reach the database.
  const canReachAurora =
    !!process.env.AWS_ROLE_ARN &&
    !!process.env.AURORA_CLUSTER_ARN &&
    !!process.env.AURORA_SECRET_ARN;

  return canReachAurora ? auroraDataRepository : mockDataRepository;
}

export { type IDataRepository } from "./interfaces/IDataRepository";
