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
