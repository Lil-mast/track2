import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/services/aurora/AuroraDataRepository";
import { invokeNova, sanitizeForAI } from "@/services/ai/bedrock";

const requestSchema = z.object({
  loanId: z.string().uuid(),
  riskScore: z.number().min(0).max(100),
  lenderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, riskScore, lenderId } = requestSchema.parse(body);

    const loanResult = await query(
      `SELECT l.*, b.name AS borrower_name, b.email AS borrower_email
       FROM loans l
       JOIN users b ON l.borrower_id = b.id
       WHERE l.id = $1 AND l.lender_id = $2`,
      [loanId, lenderId]
    );

    if (loanResult.rowCount === 0) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const context = {
      loan: loanResult.rows[0],
      riskScore,
      currentDate: new Date().toISOString(),
    };

    const systemPrompt =
      "You are a specialized loan recovery strategist. Your goal is to draft a empathetic yet firm recovery plan for a borrower at risk of default. The strategy should include: 1. A summary of the situation, 2. Recommended outreach channel and tone, 3. A proposed restructuring or repayment plan (e.g., grace period, extended term, or reduced installments), and 4. A draft message/script for the borrower. Format the entire strategy in Markdown.";
    const userPrompt = `Generate a recovery strategy for the following borrower context and risk score.\n${sanitizeForAI(context)}`;

    const strategyContent = await invokeNova(systemPrompt, userPrompt);

    // Insert with lender_id and model_id — required NOT NULL columns in the schema
    const insertResult = await query(
      `INSERT INTO strategies (loan_id, lender_id, content, model_id, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING id, status, created_at`,
      [loanId, lenderId, strategyContent, "amazon.nova-pro-v1:0"]
    );

    const newStrategy = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      strategy: {
        id: newStrategy.id,
        content: strategyContent,
        status: newStrategy.status,
        createdAt: newStrategy.created_at,
      },
    });
  } catch (error) {
    console.error("Strategy Generation Handler Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}