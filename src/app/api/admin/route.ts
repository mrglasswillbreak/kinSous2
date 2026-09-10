import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import { sql, usingLocalDb } from "@/lib/db";
export async function GET() {
  if (!(await getAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (usingLocalDb())
    return NextResponse.json({
      orders: [],
      transfers: [],
      reports: [],
      legacy: [],
    });
  const [orders, transfers, reports, legacy] = await Promise.all([
    sql`SELECT o.*,b.title FROM orders o JOIN bounties b ON b.id=o.id WHERE o.dispute_status='OPEN' OR o.stage NOT IN ('COMPLETED','REFUNDED','CANCELLED') ORDER BY o.updated_at LIMIT 100`,
    sql`SELECT * FROM transfers WHERE status<>'SUCCEEDED' ORDER BY updated_at LIMIT 100`,
    sql`SELECT * FROM message_reports ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT b.id,b.title,'Legacy order: reconcile records before migration' AS stage FROM bounties b WHERE b.status<>'OPEN' AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.id=b.id) ORDER BY b.updated_at LIMIT 100`,
  ]);
  return NextResponse.json({ orders, transfers, reports, legacy });
}
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { action, id, reason } = await req.json();
  if (
    typeof id !== "string" ||
    typeof reason !== "string" ||
    reason.trim().length < 10 ||
    reason.length > 2000
  )
    return NextResponse.json(
      { error: "Provide a target and a reason (10–2000 characters)" },
      { status: 400 },
    );
  if (action === "SUSPEND") {
    if (id === admin.userId)
      return NextResponse.json(
        { error: "Cannot suspend your own account" },
        { status: 400 },
      );
    await sql.transaction([
      sql`UPDATE users SET suspended_at=now() WHERE id=${id}`,
      sql`DELETE FROM sessions WHERE user_id=${id}`,
      sql`INSERT INTO admin_audit(actor_id,action,target_id,reason) VALUES(${admin.userId},${action},${id},${reason})`,
    ]);
    return NextResponse.json({ ok: true });
  }
  if (!["REFUND", "RELEASE", "CANCEL"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const rows =
    await sql`SELECT resolve_order(${id},${admin.userId},${action},${reason}) AS ok`;
  return NextResponse.json(
    rows[0]?.ok
      ? { ok: true }
      : { error: "Order is not eligible or a money movement already exists" },
    { status: rows[0]?.ok ? 200 : 409 },
  );
}
