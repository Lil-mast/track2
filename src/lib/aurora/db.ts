import {
  RDSDataClient,
  ExecuteStatementCommand,
  type Field,
} from "@aws-sdk/client-rds-data";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

function regionFromArn(arn: string): string {
  const parts = arn.split(":");
  return parts[3] || "eu-west-2";
}

function buildClient(clusterArn: string): RDSDataClient {
  const region = regionFromArn(clusterArn);
  const roleArn = process.env.AWS_ROLE_ARN;

  if (roleArn) {
    return new RDSDataClient({
      region,
      credentials: awsCredentialsProvider({ roleArn }),
    });
  }

  return new RDSDataClient({ region });
}

let cachedClient: RDSDataClient | null = null;

function getClient(): RDSDataClient {
  const clusterArn = process.env.AURORA_CLUSTER_ARN;
  if (!clusterArn) {
    throw new Error(
      "Database not configured: AURORA_CLUSTER_ARN must be set in environment variables."
    );
  }
  if (!cachedClient) {
    cachedClient = buildClient(clusterArn);
  }
  return cachedClient;
}

function extractFieldValue(field: Field): unknown {
  if ("isNull" in field && field.isNull) return null;
  if ("stringValue" in field && field.stringValue !== undefined) {
    return field.stringValue;
  }
  if ("longValue" in field && field.longValue !== undefined) {
    return field.longValue;
  }
  if ("doubleValue" in field && field.doubleValue !== undefined) {
    return field.doubleValue;
  }
  if ("booleanValue" in field && field.booleanValue !== undefined) {
    return field.booleanValue;
  }
  if ("blobValue" in field && field.blobValue !== undefined) {
    return field.blobValue;
  }
  return null;
}

function formatRecords(
  records: Field[][] | undefined,
  columnMetadata: { name?: string }[] | undefined
): Record<string, unknown>[] {
  if (!records || !columnMetadata) return [];

  return records.map((record) => {
    const row: Record<string, unknown> = {};
    record.forEach((value, index) => {
      const colName = columnMetadata[index]?.name ?? `col_${index}`;
      row[colName] = extractFieldValue(value);
    });
    return row;
  });
}

function buildNamedParam(name: string, val: unknown) {
  if (val === null || val === undefined) {
    return { name, value: { isNull: true } };
  }
  if (typeof val === "string") {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val
      );
    return {
      name,
      value: { stringValue: val },
      ...(isUuid ? { typeHint: "UUID" as const } : {}),
    };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { name, value: { longValue: val } };
    return { name, value: { doubleValue: val } };
  }
  if (typeof val === "boolean") {
    return { name, value: { booleanValue: val } };
  }
  return { name, value: { stringValue: JSON.stringify(val) } };
}

function formatParameters(params: Record<string, unknown> | unknown[]) {
  if (!params || (Array.isArray(params) && params.length === 0)) return [];
  if (Array.isArray(params)) {
    return params.map((val, index) => buildNamedParam(`p${index}`, val));
  }
  return Object.entries(params).map(([name, val]) => buildNamedParam(name, val));
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

/**
 * Executes SQL against Aurora via the RDS Data API.
 * Named params: { loanId: "uuid" } with SQL `:loanId`
 * Positional array: ["uuid"] with SQL `$1` (rewritten to `:p0`)
 */
export async function query(
  sql: string,
  params: Record<string, unknown> | unknown[] = []
): Promise<QueryResult> {
  const resourceArn = process.env.AURORA_CLUSTER_ARN;
  const secretArn = process.env.AURORA_SECRET_ARN;
  const database = process.env.AURORA_DATABASE ?? "recoveryai";

  if (!resourceArn || !secretArn) {
    throw new Error(
      "Database not configured: AURORA_CLUSTER_ARN and AURORA_SECRET_ARN must be set."
    );
  }

  let processedSql = sql;
  if (Array.isArray(params)) {
    processedSql = sql.replace(/\$(\d+)/g, (_, num) => `:p${parseInt(num, 10) - 1}`);
  }

  const command = new ExecuteStatementCommand({
    resourceArn,
    secretArn,
    database,
    sql: processedSql,
    parameters: formatParameters(params),
    includeResultMetadata: true,
  });

  const response = await getClient().send(command);

  return {
    rows: formatRecords(response.records, response.columnMetadata),
    rowCount: response.records?.length ?? 0,
  };
}
