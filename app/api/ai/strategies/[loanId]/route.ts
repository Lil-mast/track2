import { NextRequest } from "next/server";
import { getStrategiesHandler } from "@/ai-engine/handlers/get-strategies";

export async function GET(
  req: NextRequest,
  { params }: { params: { loanId: string } }
) {
  return getStrategiesHandler(req, { params });
}
