import { NextRequest, NextResponse } from "next/server";
import { query } from "@/ai-engine/services/db";
import { invokeNova, sanitizeForAI } from "@/ai-engine/services/ai";
import { z } from "zod";

const requestSchema = z.object({
  loanId: z.string().uuid(),
  borrowerId: z.string().uuid(),
  lenderId: z.string().uuid(),
});

export async function riskScoreHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = requestSchema.parse(body);
    const { loanId, borrowerId, lenderId } = validatedData;

    const loanDataResult = await query(
      `SELECT l.*, b.name as borrower_name, b.email as borrower_email
       FROM loans l
       JOIN users b ON l.borrower_id = b.id
       WHERE l.id = $1 AND l.borrower_id = $2 AND l.lender_id = $3`,
      [loanId, borrowerId, lenderId]
    );

    if (loanDataResult.rowCount === 0) {
      return NextResponse.json({ error: "Loan not found or unauthorized" }, { status: 404 });
    }

    const loan = loanDataResult.rows[0];

    const scheduleResult = await query(
      `SELECT * FROM repayment_schedule WHERE loan_id = $1 ORDER BY due_date ASC`,
      [loanId]
    );
    const schedule = scheduleResult.rows;

    const aiInput = {
      loan,
      repaymentSchedule: schedule,
      assessmentDate: new Date().toISOString(),
    };
    const sanitizedContext = sanitizeForAI(aiInput);

    const systemPrompt = "You are a senior financial risk analyst. Analyze the provided borrower data and repayment history to calculate a dynamic risk score (0-100). Provide a concise reasoning for the score, focusing on payment trends, delays, and liquidity signals. Format your response as JSON: { \"risk_score\": number, \"reasoning\": \"string\" }";
    const userPrompt = `Analyze the following borrower data for default risk. 
    ${sanitizedContext}`;

    const aiResponse = await invokeNova(systemPrompt, userPrompt);
    
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }
    const { risk_score, reasoning } = JSON.parse(jsonMatch[0]);

    await query(
      `INSERT INTO ai_insights (loan_id, risk_score, reasoning, model_id)
       VALUES ($1, $2, $3, $4)`,
      [loanId, risk_score, reasoning, "amazon.nova-pro-v1:0"]
    );

    return NextResponse.json({
      success: true,
      riskScore: risk_score,
      reasoning,
    });

  } catch (error: any) {
    console.error("Risk Score Handler Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
