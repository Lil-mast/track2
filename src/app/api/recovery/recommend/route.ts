// MIGRATE FROM: frontend/src/app/api/recovery/recommend/route.ts
// No changes needed — already a Next.js Route Handler
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Not yet migrated" }, { status: 501 });
}
