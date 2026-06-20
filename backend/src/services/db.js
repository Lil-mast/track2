import { RDSDataClient, ExecuteStatementCommand } from "@aws-sdk/client-rds-data";
import dotenv from "dotenv";

dotenv.config();

// --- Validate required environment variables at startup ---
const REQUIRED_DB_ENV_VARS = ["AURORA_CLUSTER_ARN", "AURORA_SECRET_ARN"];
const missingVars = REQUIRED_DB_ENV_VARS.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(
    `❌ FATAL: Missing required database environment variables: ${missingVars.join(", ")}\n` +
    `   Please set them in your .env file or environment.\n` +
    `   See BACKEND_SETUP.md for details.`
  );
  // Don't call process.exit() — let the caller handle startup failures gracefully.
  // The query function will throw a clear error if these are undefined at call time.
}

// Initialize client without explicit credentials if they aren't provided in .env
// This allows the SDK to use the default credential provider chain (IAM Roles, Environment, etc.)
const clientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
  };
}

const client = new RDSDataClient(clientConfig);

const resourceArn = process.env.AURORA_CLUSTER_ARN;
const secretArn = process.env.AURORA_SECRET_ARN;
const database = process.env.AURORA_DATABASE || "recoveryai";

/**
 * Helper to map RDS Data API response to a more friendly format.
 */
const formatRecords = (records, columnMetadata) => {
  if (!records) return [];
  return records.map((record) => {
    const obj = {};
    record.forEach((value, index) => {
      const colName = columnMetadata[index].name;
      const val = Object.values(value).find(v => v !== undefined && v !== null);
      obj[colName] = val;
    });
    return obj;
  });
};

/**
 * Helper to build named parameters for the RDS Data API.
 * 
 * Accepts a plain object like: { loanId: "uuid-here", score: 75 }
 * and returns the RDS Data API parameter array format:
 *   [{ name: "loanId", value: { stringValue: "uuid-here" }, typeHint: "UUID" }, ...]
 * 
 * SQL queries should use named placeholders like :loanId, :score, etc.
 */
const formatParameters = (params) => {
  if (!params || (Array.isArray(params) && params.length === 0)) return [];
  if (typeof params !== "object") return [];

  // If params is an object (not an array), convert to named parameters
  if (!Array.isArray(params)) {
    return Object.entries(params).map(([name, val]) => buildNamedParam(name, val));
  }

  // Legacy support: if params is an array, generate positional names (p0, p1, ...)
  // SQL should use :p0, :p1, etc. as placeholders
  return params.map((val, index) => buildNamedParam(`p${index}`, val));
};

/**
 * Builds a single named parameter object for the RDS Data API.
 */
const buildNamedParam = (name, val) => {
  if (val === null || val === undefined) {
    return { name, value: { isNull: true } };
  }
  if (typeof val === "string") {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    return {
      name,
      value: { stringValue: val },
      ...(isUuid ? { typeHint: "UUID" } : {}),
    };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { name, value: { longValue: val } };
    return { name, value: { doubleValue: val } };
  }
  if (typeof val === "boolean") {
    return { name, value: { booleanValue: val } };
  }
  // Fallback: serialize complex types as JSON strings
  return { name, value: { stringValue: JSON.stringify(val) } };
};

/**
 * Executes a SQL query against the Aurora database via the RDS Data API.
 * 
 * @param {string} sql — SQL statement. Use :paramName for named parameters.
 * @param {Object|Array} params — Named params object (preferred) or legacy positional array.
 *   Named:  { loanId: "uuid", status: "active" }  →  SQL uses :loanId, :status
 *   Array:  ["uuid", "active"]                     →  SQL uses :p0, :p1
 */
export const query = async (sql, params = []) => {
  if (!resourceArn || !secretArn) {
    throw new Error(
      "Database not configured: AURORA_CLUSTER_ARN and AURORA_SECRET_ARN must be set in environment variables."
    );
  }

  // If positional array params are provided, rewrite $1, $2, ... to :p0, :p1, ...
  let processedSql = sql;
  if (Array.isArray(params)) {
    processedSql = sql.replace(/\$(\d+)/g, (_, num) => `:p${parseInt(num) - 1}`);
  }

  try {
    const command = new ExecuteStatementCommand({
      resourceArn,
      secretArn,
      database,
      sql: processedSql,
      parameters: formatParameters(params),
      includeResultMetadata: true,
    });

    const response = await client.send(command);
    
    return {
      rows: formatRecords(response.records, response.columnMetadata),
      rowCount: response.records ? response.records.length : 0,
    };
  } catch (error) {
    console.error("RDS Data API Error:", error);
    throw error;
  }
};

export default client;
