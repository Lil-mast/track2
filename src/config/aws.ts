/**
 * AWS integration configuration (Bedrock AI only).
 */

export const awsConfig = {
  region: process.env.AWS_REGION ?? "us-east-1",

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
