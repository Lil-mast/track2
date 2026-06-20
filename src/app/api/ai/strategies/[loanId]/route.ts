// MIGRATE FROM: backend/src/handlers/get-strategies.js
// See MIGRATION.md Step 5
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ error: "Not yet migrated" }, { status: 501 });
}
