import { NextResponse } from "next/server";
import { sql, usingLocalDb } from "@/lib/db";
import { sendAccountLink } from "@/lib/email";
export async function POST(req: Request) {
  const { email } = await req.json();
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email)
  )
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  if (usingLocalDb() || !process.env.RESEND_API_KEY)
    return NextResponse.json(
      { error: "Password recovery is not configured yet" },
      { status: 503 },
    );
  const rows =
    await sql`SELECT id,email FROM users WHERE lower(email)=${email.toLowerCase().trim()} AND suspended_at IS NULL`;
  if (rows[0])
    try {
      await sendAccountLink(rows[0].id, rows[0].email, "RESET");
    } catch {
      console.error("recovery_email_failed");
    }
  return NextResponse.json({
    message:
      "If this address has an account, a reset link will arrive shortly.",
  });
}
