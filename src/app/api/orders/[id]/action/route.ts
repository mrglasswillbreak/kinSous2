import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { orderForUser } from "@/lib/payments";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await params;
  const order = await orderForUser(id, session.userId);
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const { action, note } = await req.json();
  if (
    !["SHOPPING", "IN_TRANSIT", "DELIVERED", "COMPLETED", "DISPUTE"].includes(
      action,
    )
  )
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (
    action === "DISPUTE" &&
    (typeof note !== "string" || note.trim().length < 10 || note.length > 2000)
  )
    return NextResponse.json(
      { error: "Describe the issue in 10–2000 characters" },
      { status: 400 },
    );
  const result =
    await sql`SELECT transition_order(${id},${session.userId},${action},${action === "DISPUTE" ? note.trim() : null}) AS ok`;
  if (!result[0]?.ok)
    return NextResponse.json(
      {
        error:
          "Order changed or this action is unavailable. Refresh and try again.",
      },
      { status: 409 },
    );
  return NextResponse.json({ ok: true });
}
