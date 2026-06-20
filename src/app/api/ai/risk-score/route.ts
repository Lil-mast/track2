// MIGRATE FROM: backend/src/handlers/risk-score.js
// See MIGRATION.md Step 5
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Not yet migrated" }, { status: 501 });
}
