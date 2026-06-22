import { NextRequest, NextResponse } from "next/server";
import { query } from "@/services/aurora/AuroraDataRepository";

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

    const strategiesResult = await query(
      `SELECT s.*
       FROM strategies s
       JOIN loans l ON s.loan_id = l.id
       WHERE s.loan_id = $1 AND l.lender_id = $2
       ORDER BY s.created_at DESC`,
      [loanId, lenderId]
    );

    return NextResponse.json({
      success: true,
      strategies: strategiesResult.rows,
    });
  } catch (error) {
    console.error("Get Strategies Handler Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}