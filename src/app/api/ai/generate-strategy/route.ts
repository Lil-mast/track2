import { NextRequest } from "next/server";
import { generateStrategyHandler } from "@/ai-engine/handlers/generate-strategy";

export async function POST(req: NextRequest) {
  return generateStrategyHandler(req);
}
