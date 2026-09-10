import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql, usingLocalDb } from "@/lib/db";
import { flutterwave } from "@/lib/payments";
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (usingLocalDb())
    return NextResponse.json({ configured: false, banks: [] });
  const rows =
    await sql`SELECT payout_bank,payout_account,payout_name FROM users WHERE id=${session.userId}`;
  let banks: unknown[] = [];
  try {
    banks = await flutterwave("/banks/NG");
  } catch {}
  return NextResponse.json({
    configured: Boolean(rows[0]?.payout_account),
    accountName: rows[0]?.payout_name,
    last4: rows[0]?.payout_account?.slice(-4),
    banks,
  });
}
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HELPER")
      return NextResponse.json(
        { error: "Helper account required" },
        { status: 403 },
      );
    const { bank, account } = await req.json();
    if (
      typeof bank !== "string" ||
      !/^\d{3,6}$/.test(bank) ||
      typeof account !== "string" ||
      !/^\d{10}$/.test(account)
    )
      return NextResponse.json(
        { error: "Choose a bank and enter a 10-digit account number" },
        { status: 400 },
      );
    const active =
      await sql`SELECT id FROM orders WHERE helper_id=${session.userId} AND stage NOT IN ('REFUNDED','CANCELLED') AND NOT EXISTS(SELECT 1 FROM transfers WHERE order_id=orders.id AND status='SUCCEEDED') LIMIT 1`;
    if (active.length)
      return NextResponse.json(
        {
          error:
            "Payout details cannot change while an order or payout is active",
        },
        { status: 409 },
      );
    const resolved = await flutterwave("/accounts/resolve", {
      account_number: account,
      account_bank: bank,
    });
    if (!resolved.account_name) throw Error("Account could not be verified");
    await sql`UPDATE users SET payout_bank=${bank},payout_account=${account},payout_name=${resolved.account_name} WHERE id=${session.userId}`;
    return NextResponse.json({ ok: true, accountName: resolved.account_name });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Unable to save payout details",
      },
      { status: 400 },
    );
  }
}
