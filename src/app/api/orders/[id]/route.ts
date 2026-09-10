import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { orderForUser } from "@/lib/payments";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const order = await orderForUser(id, session.userId);
  if (!order)
    return NextResponse.json(
      {
        error:
          "No paid-work order exists for this bounty yet. Select a bidder with payout details first.",
      },
      { status: 404 },
    );
  const [events, payments, transfers] = await Promise.all([
    sql`SELECT stage,note,created_at FROM order_events WHERE order_id=${id} ORDER BY created_at`,
    sql`SELECT status,updated_at FROM payments WHERE order_id=${id} ORDER BY created_at DESC`,
    sql`SELECT kind,status,updated_at FROM transfers WHERE order_id=${id}`,
  ]);
  return NextResponse.json({
    order,
    events,
    payment: payments[0] || null,
    transfer: transfers[0] || null,
  });
}
