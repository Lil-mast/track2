import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/aurora/db";

/**
 * PATCH /api/ai/strategy/[id]
 *
 * Human-in-the-loop review action for an AI recovery strategy.
 * Pure database update — does not depend on Bedrock.
 *
 * Body: { action: "approve" | "reject" | "execute", lenderId: uuid }
 *
 * Status transitions:
 *   approve -> status='approved'  (sets approved_at, reviewed_at)
 *   reject  -> status='rejected'  (sets reviewed_at)
 *   execute -> status='executed'  (sets executed_at, approved_at, reviewed_at)
 *
 * Tenant-scoped: only updates rows belonging to the given lender.
 */

const requestSchema = z.object({
  action: z.enum(["approve", "reject", "execute"]),
  lenderId: z.string().uuid(),
});

const STATUS_SQL: Record<string, string> = {
  approve: `status = 'approved', approved_at = NOW(), reviewed_at = NOW()`,
  reject: `status = 'rejected', reviewed_at = NOW()`,
  execute: `status = 'executed', executed_at = NOW(),
            approved_at = COALESCE(approved_at, NOW()), reviewed_at = NOW()`,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { error: "Invalid strategy id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, lenderId } = requestSchema.parse(body);

    const result = await query(
      `UPDATE strategies
       SET ${STATUS_SQL[action]}
       WHERE id = :id AND lender_id = :lenderId
       RETURNING id, status, approved_at, executed_at, reviewed_at, updated_at`,
      { id, lenderId }
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Strategy not found or not owned by this lender" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, strategy: result.rows[0] });
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
