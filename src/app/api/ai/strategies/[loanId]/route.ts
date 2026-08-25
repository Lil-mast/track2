import { NextRequest, NextResponse } from "next/server";
import { api, fetchQuery } from "@/lib/convex/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  try {
    const { loanId } = await params;
    const lenderId = request.nextUrl.searchParams.get("lenderId");

    if (!lenderId) {
      return NextResponse.json(
        { error: "lenderId is required" },
        { status: 400 }
      );
    }

    const strategies = await fetchQuery(api.repository.getStrategiesForLoan, {
      loanId,
      lenderId,
    });

    return NextResponse.json({
      success: true,
      strategies,
    });
  } catch (error) {
    console.error("Get Strategies Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
