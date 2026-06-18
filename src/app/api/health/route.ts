import { NextResponse } from "next/server";
import { isAuroraConfigured } from "@/config/aws";
import { pingDatabase } from "@/lib/aws/rds-data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuroraConfigured()) {
    return NextResponse.json({
      status: "ok",
      mode: "mock",
      message: "Aurora is not configured — using mock data mode.",
    });
  }

  try {
    await pingDatabase();

    return NextResponse.json({
      status: "ok",
      mode: "aurora",
      message: "Database is reachable.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database health check failed";

    return NextResponse.json(
      {
        status: "error",
        mode: "aurora",
        message,
      },
      { status: 503 }
    );
  }
}
