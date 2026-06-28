/**
 * Future AWS integration configuration.
 * Environment variables will be loaded here when services are connected.
 */

export const awsConfig = {
  region: process.env.AWS_REGION ?? "us-east-1",

  aurora: {
    enabled: process.env.AURORA_ENABLED === "true",
    clusterArn: process.env.AURORA_CLUSTER_ARN,
    secretArn: process.env.AURORA_SECRET_ARN,
    database: process.env.AURORA_DATABASE ?? "recoveryai",
    roleArn: process.env.AWS_ROLE_ARN,
  },

  cognito: {
    enabled: process.env.COGNITO_ENABLED === "true",
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    issuer: process.env.COGNITO_ISSUER,
  },

  bedrock: {
    enabled: process.env.BEDROCK_ENABLED === "true",
    modelId: process.env.BEDROCK_MODEL_ID ?? "amazon.nova-pro-v1:0",
    region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "us-east-1",
  },
} as const;

export type AwsConfig = typeof awsConfig;

/**
 * Single source of truth for whether the app should use Aurora (vs mock data).
 *
 * Must stay in sync everywhere — both the data repository selection
 * (services/index.ts) and the default lender id (lib/constants.ts) depend on
 * it. If these disagree, the app queries Aurora with a mock lender id (or vice
 * versa), which throws at runtime.
 *
 * Resolution:
 *   - AURORA_ENABLED=true  -> Aurora (explicit override)
 *   - AURORA_ENABLED=false -> mock   (explicit override)
 *   - otherwise: Aurora when the runtime can reach it (OIDC role + Aurora ARNs,
 *     i.e. on Vercel). Local dev without AWS_ROLE_ARN stays on mock.
 */
export function isAuroraActive(): boolean {
  if (process.env.AURORA_ENABLED === "true") return true;
  if (process.env.AURORA_ENABLED === "false") return false;
  return (
    !!process.env.AWS_ROLE_ARN &&
    !!process.env.AURORA_CLUSTER_ARN &&
    !!process.env.AURORA_SECRET_ARN
  );
}
