import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, usingLocalDb } from "@/lib/db";
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (usingLocalDb()) return NextResponse.json({ orders: [], demo: true });
  const orders =
    await sql`SELECT o.*,b.title FROM orders o JOIN bounties b ON b.id=o.id WHERE o.seeker_id=${session.userId} OR o.helper_id=${session.userId} ORDER BY o.updated_at DESC LIMIT 100`;
  return NextResponse.json({ orders });
}
