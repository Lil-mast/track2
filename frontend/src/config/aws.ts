/**
 * Future AWS integration configuration.
 * Environment variables will be loaded here when services are connected.
 */

export const awsConfig = {
  region: process.env.AWS_REGION ?? "us-east-1",

  aurora: {
    enabled: process.env.AURORA_ENABLED === "true",
    host: process.env.AURORA_HOST,
    port: parseInt(process.env.AURORA_PORT ?? "5432", 10),
    database: process.env.AURORA_DATABASE ?? "recoveriq",
    ssl: process.env.AURORA_SSL !== "false",
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
