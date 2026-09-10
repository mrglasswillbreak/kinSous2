import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, usingLocalDb } from "@/lib/db";
import { tokenHash } from "@/lib/email";
export async function POST(req: Request) {
  if (usingLocalDb())
    return NextResponse.json(
      { error: "Email verification needs the hosted database" },
      { status: 503 },
    );
  const { token, password } = await req.json();
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  const hash = tokenHash(token);
  const rows =
    await sql`SELECT kind FROM auth_tokens WHERE id=${hash} AND expires_at>now() AND used_at IS NULL`;
  if (!rows[0])
    return NextResponse.json(
      { error: "This link has expired or was already used" },
      { status: 400 },
    );
  if (
    rows[0].kind === "RESET" &&
    (typeof password !== "string" ||
      password.length < 10 ||
      Buffer.byteLength(password) > 72)
  )
    return NextResponse.json(
      { error: "Use 10 or more characters, up to 72 bytes" },
      { status: 400 },
    );
  const passwordHash =
    rows[0].kind === "RESET" ? await bcrypt.hash(password, 12) : null;
  try {
    const result =
      await sql`SELECT redeem_account_token(${hash},${passwordHash}) AS ok`;
    return NextResponse.json(
      result[0]?.ok
        ? { message: "Account updated. Sign in to continue." }
        : { error: "This link has expired or was already used" },
      { status: result[0]?.ok ? 200 : 400 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "This email address is unavailable. Request a new verification link.",
      },
      { status: 409 },
    );
  }
}
