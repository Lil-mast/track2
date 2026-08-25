import { NextRequest, NextResponse } from "next/server";
import { runRecoveryEngine } from "@/services/recovery-engine";
import { createStrategyFromEngineConvex } from "@/services/convex/ConvexDataRepository";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import type { RecommendRequestBody } from "@/types/recovery-engine";

const ACTION_MAP: Record<string, string> = {
  remind: "email_reminder",
  renegotiate: "payment_plan",
  escalate: "legal_notice",
};

const RISK_MAP: Record<number, "low" | "medium" | "high" | "critical"> = {
  0: "low",
  1: "medium",
  2: "high",
  3: "critical",
};

function toRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 70) return RISK_MAP[3];
  if (score >= 40) return RISK_MAP[2];
  if (score >= 20) return RISK_MAP[1];
  return RISK_MAP[0];
}

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

    const { aiRecommendation, riskAssessment, finalAction, input } = result;
    const recoveryAction = (ACTION_MAP[aiRecommendation.recommendedAction] ??
      "email_reminder") as import("@/types").RecoveryAction;

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    await createStrategyFromEngineConvex({
      lenderId,
      loanId: result.loanId,
      borrowerId: result.borrowerId,
      action: recoveryAction,
      status: "pending",
      priority:
        riskAssessment.score >= 70 ? 1 : riskAssessment.score >= 40 ? 2 : 3,
      confidenceScore: Math.min(0.99, 0.5 + riskAssessment.score / 200),
      riskLevel: toRiskLevel(riskAssessment.score),
      title: finalAction.label,
      summary: aiRecommendation.nextStep,
      reasoning: aiRecommendation.reasoning,
      expectedRecoveryAmount:
        input.totalOutstanding * (riskAssessment.score >= 70 ? 0.6 : 0.8),
      expectedRecoveryRate: riskAssessment.score >= 70 ? 0.6 : 0.8,
      aiModel: "recoveryai-engine-v1",
      aiModelVersion: "1.0",
      generatedAt: result.timestamp,
      expiresAt,
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
