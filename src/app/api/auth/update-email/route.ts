import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { password, newEmail } = await req.json();

    if (!password || !newEmail) {
      return NextResponse.json(
        { error: "Password and new email are required" },
        { status: 400 }
      );
    }

    const normalised = newEmail.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalised)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT password_hash, name, role FROM users WHERE id = ${session.userId}
    `;
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 }
      );
    }

    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalised} AND id != ${session.userId}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 409 }
      );
    }

    await sql`
      UPDATE users SET email = ${normalised} WHERE id = ${session.userId}
    `;

    // Refresh session with updated email
    await setSessionCookie({
      userId: session.userId,
      email: normalised,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, email: normalised });
  } catch (err) {
    console.error("Update email error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
