import {
  RDSDataClient,
  ExecuteStatementCommand,
  type Field,
  type SqlParameter,
} from "@aws-sdk/client-rds-data";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { awsConfig, isAuroraConfigured } from "@/config/aws";

function fieldToValue(field: Field | undefined): unknown {
  if (!field || field.isNull) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.longValue !== undefined) return field.longValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.blobValue !== undefined) return field.blobValue;
  return null;
}

function toSqlParameters(
  parameters: Record<string, unknown>
): SqlParameter[] {
  return Object.entries(parameters).map(([name, value]) => {
    if (value === null || value === undefined) {
      return { name, value: { isNull: true } };
    }

    if (typeof value === "boolean") {
      return { name, value: { booleanValue: value } };
    }

    if (typeof value === "number") {
      return Number.isInteger(value)
        ? { name, value: { longValue: value } }
        : { name, value: { doubleValue: value } };
    }

    return { name, value: { stringValue: String(value) } };
  });
}

function getClient(): RDSDataClient {
  const roleArn = awsConfig.aurora.roleArn;

  if (!roleArn) {
    throw new Error("AWS_ROLE_ARN is not configured");
  }

  return new RDSDataClient({
    region: awsConfig.region,
    credentials: awsCredentialsProvider({ roleArn }),
  });
}

export async function query<T extends Record<string, unknown>>(
  sql: string,
  parameters: Record<string, unknown> = {}
): Promise<T[]> {
  if (!isAuroraConfigured()) {
    throw new Error("Aurora is not configured");
  }

  const client = getClient();
  const command = new ExecuteStatementCommand({
    resourceArn: awsConfig.aurora.clusterArn,
    secretArn: awsConfig.aurora.secretArn,
    database: awsConfig.aurora.database,
    sql,
    parameters: toSqlParameters(parameters),
    includeResultMetadata: true,
  });

  const response = await client.send(command);
  const columnNames =
    response.columnMetadata?.map((column) => column.name ?? "") ?? [];

  return (response.records ?? []).map((record) => {
    const row: Record<string, unknown> = {};
    record.forEach((field, index) => {
      const columnName = columnNames[index] ?? `column_${index}`;
      row[columnName] = fieldToValue(field);
    });
    return row as T;
  });
}

/** Lightweight ping used to wake Aurora after auto-pause. */
export async function pingDatabase(): Promise<void> {
  await query("SELECT 1 AS ok");
}
