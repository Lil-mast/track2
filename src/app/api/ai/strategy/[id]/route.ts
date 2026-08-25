import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api, fetchMutation, fetchQuery } from "@/lib/convex/server";

/**
 * PATCH /api/ai/strategy/[id]
 *
 * Human-in-the-loop review action for an AI recovery strategy.
 */

const requestSchema = z.object({
  action: z.enum(["approve", "reject", "execute"]),
  lenderId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim().length === 0 || id.length > 128) {
      return NextResponse.json(
        { error: "Invalid strategy id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, lenderId } = requestSchema.parse(body);

    const lender = await fetchQuery(api.repository.getLender, { lenderId });
    const userName = lender?.name ?? "System";
    const userEmail = lender?.contactEmail ?? "system@recoveriq.ai";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const ua = request.headers.get("user-agent") ?? undefined;

    const updated = await fetchMutation(api.repository.updateStrategyStatus, {
      strategyId: id,
      lenderId,
      action,
      auditMeta: {
        userName,
        userEmail,
        ipAddress: ip,
        userAgent: ua,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Strategy not found or not owned by this lender" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, strategy: updated });
  } catch (error) {
    console.error("Strategy Action Handler Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
