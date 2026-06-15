/**
 * AWS integration configuration.
 * Values are loaded from Vercel project environment variables.
 */

export const awsConfig = {
  region: process.env.AWS_REGION ?? "us-east-1",

  aurora: {
    /** Legacy flag — prefer checking cluster/secret ARNs via isAuroraConfigured(). */
    enabled: process.env.AURORA_ENABLED === "true",
    clusterArn: process.env.AURORA_CLUSTER_ARN,
    secretArn: process.env.AURORA_SECRET_ARN,
    database: process.env.AURORA_DATABASE ?? "recoveriq",
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

export function isAuroraConfigured(): boolean {
  return Boolean(
    awsConfig.aurora.clusterArn &&
      awsConfig.aurora.secretArn &&
      awsConfig.aurora.database &&
      awsConfig.aurora.roleArn
  );
}
