import { NextRequest } from "next/server";
import { getStrategiesHandler } from "@/ai-engine/handlers/get-strategies";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  const { loanId } = await params;
  return getStrategiesHandler(req, { params: { loanId } });
}
