import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api, fetchMutation, fetchQuery } from "@/lib/convex/server";
import { invokeNova, sanitizeForAI } from "@/services/ai/bedrock";
import { awsConfig } from "@/config/aws";

const requestSchema = z.object({
  loanId: z.string().uuid(),
  riskScore: z.number().min(0).max(100),
  lenderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (!awsConfig.bedrock.enabled) {
    return NextResponse.json(
      { error: "Bedrock is not enabled" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = requestSchema.parse(body);
    const { loanId, riskScore, lenderId } = validatedData;

    const loanData = await fetchQuery(api.repository.getLoanForAi, {
      loanId,
      lenderId,
    });

    if (!loanData) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const context = {
      loan: loanData.loan,
      riskScore,
      currentDate: new Date().toISOString(),
    };
    const sanitizedContext = sanitizeForAI(context);

    const systemPrompt =
      "You are a specialized loan recovery strategist. Your goal is to draft a empathetic yet firm recovery plan for a borrower at risk of default. The strategy should include: 1. A summary of the situation, 2. Recommended outreach channel and tone, 3. A proposed restructuring or repayment plan (e.g., grace period, extended term, or reduced installments), and 4. A draft message/script for the borrower. Format the entire strategy in Markdown.";
    const userPrompt = `Generate a recovery strategy for the following borrower context and risk score.\n${sanitizedContext}`;

    const strategyContent = await invokeNova(systemPrompt, userPrompt);

    const newStrategy = await fetchMutation(api.repository.createBedrockStrategy, {
      loanId,
      lenderId,
      content: strategyContent,
      modelId: awsConfig.bedrock.modelId,
      riskScore,
    });

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
