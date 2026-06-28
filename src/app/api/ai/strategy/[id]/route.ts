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

const AUDIT_VERB: Record<string, string> = {
  approve: "Approved",
  reject: "Rejected",
  execute: "Executed",
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
       RETURNING id, status, recommended_action, approved_at, executed_at,
                 reviewed_at, updated_at`,
      { id, lenderId }
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Strategy not found or not owned by this lender" },
        { status: 404 }
      );
    }

    const updated = result.rows[0];

    // Best-effort audit trail — never fail the action if logging fails.
    try {
      const lender = await query(
        `SELECT name, email FROM users WHERE id = :lenderId`,
        { lenderId }
      );
      const userName = (lender.rows[0]?.name as string) ?? "System";
      const userEmail =
        (lender.rows[0]?.email as string) ?? "system@recoveriq.ai";
      const label =
        (updated.recommended_action as string) ?? "Recovery Strategy";
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      const ua = request.headers.get("user-agent") ?? null;

      await query(
        `INSERT INTO audit_logs
           (lender_id, user_id, user_name, user_email, action, entity_type,
            entity_id, entity_label, description, ip_address, user_agent)
         VALUES
           (:lenderId, :lenderId, :userName, :userEmail,
            CAST(:auditAction AS audit_action),
            CAST('recommendation' AS audit_entity_type),
            CAST(:entityId AS text), :label, :description, :ip, :ua)`,
        {
          lenderId,
          userName,
          userEmail,
          auditAction: action,
          entityId: id,
          label,
          description: `${AUDIT_VERB[action]} AI recovery strategy "${label}"`,
          ip,
          ua,
        }
      );
    } catch (auditErr) {
      console.error("Audit log write failed (non-fatal):", auditErr);
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
