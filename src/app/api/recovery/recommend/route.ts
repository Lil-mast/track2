import { NextRequest, NextResponse } from "next/server";
import { runRecoveryEngine } from "@/services/recovery-engine";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import type { RecommendRequestBody } from "@/types/recovery-engine";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RecommendRequestBody;

    if (!body.loanId || typeof body.loanId !== "string") {
      return NextResponse.json(
        { error: "loanId is required" },
        { status: 400 }
      );
    }

    const lenderId = body.lenderId ?? DEFAULT_LENDER_ID;

    const result = await runRecoveryEngine({
      lenderId,
      loanId: body.loanId,
      requestMeta: {
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "127.0.0.1",
        userAgent: request.headers.get("user-agent") ?? "Unknown",
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to generate recovery recommendation" },
      { status: 500 }
    );
  }
}
