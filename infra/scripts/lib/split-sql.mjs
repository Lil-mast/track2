/**
 * Split a PostgreSQL script into individual statements.
 *
 * The RDS Data API executes ONE statement per call, so we must split the
 * schema file. A naive split on ";" breaks on:
 *   - semicolons inside single-quoted string literals
 *   - semicolons inside dollar-quoted bodies ($$ ... $$ in PL/pgSQL functions)
 *   - semicolons inside -- line comments and block comments
 *
 * This is a small char-by-char state machine that tracks those contexts and
 * only treats ";" as a terminator when in the "normal" state.
 */
export function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  const n = sql.length;

  // normal | line_comment | block_comment | single_quote | dollar_quote
  let state = "normal";
  let dollarTag = "";

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (state === "normal") {
      if (ch === "-" && next === "-") {
        state = "line_comment";
        current += ch;
        i += 1;
        continue;
      }
      if (ch === "/" && next === "*") {
        state = "block_comment";
        current += "/*";
        i += 2;
        continue;
      }
      if (ch === "'") {
        state = "single_quote";
        current += ch;
        i += 1;
        continue;
      }
      if (ch === "$") {
        const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
        if (m) {
          dollarTag = m[0];
          state = "dollar_quote";
          current += dollarTag;
          i += dollarTag.length;
          continue;
        }
      }
      if (ch === ";") {
        current += ch;
        if (hasSqlContent(current)) statements.push(current.trim());
        current = "";
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (state === "line_comment") {
      current += ch;
      if (ch === "\n") state = "normal";
      i += 1;
      continue;
    }

    if (state === "block_comment") {
      if (ch === "*" && next === "/") {
        current += "*/";
        i += 2;
        state = "normal";
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (state === "single_quote") {
      // '' is an escaped quote inside a string literal — stay in the string
      if (ch === "'" && next === "'") {
        current += "''";
        i += 2;
        continue;
      }
      if (ch === "'") {
        current += ch;
        state = "normal";
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (state === "dollar_quote") {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        state = "normal";
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }
  }

  if (hasSqlContent(current)) statements.push(current.trim());
  return statements;
}

/**
 * True if the chunk contains real SQL (not just whitespace/comments).
 * Comment-stripping here is only for the empty check — the original text
 * (comments included) is what actually gets sent to the Data API.
 */
function hasSqlContent(chunk) {
  const noBlock = chunk.replace(/\/\*[\s\S]*?\*\//g, "");
  const noLine = noBlock.replace(/--[^\n]*/g, "");
  return noLine.replace(/;/g, "").trim().length > 0;
}
