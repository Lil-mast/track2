import { NextRequest } from "next/server";
import { riskScoreHandler } from "@/ai-engine/handlers/risk-score";

export async function POST(req: NextRequest) {
  return riskScoreHandler(req);
}
