import { sendAccountLink } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initDb, sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { password, newEmail } = await req.json();

    if (!password || !newEmail) {
      return NextResponse.json(
        { error: "Password and new email are required" },
        { status: 400 },
      );
    }

    const normalised = newEmail.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalised)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT password_hash, name, phone, role FROM users WHERE id = ${session.userId}
    `;
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 401 },
      );
    }

    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalised} AND id != ${session.userId}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 409 },
      );
    }

    await sendAccountLink(session.userId, normalised, "EMAIL");
    return NextResponse.json({
      success: true,
      message: "Check your new email address for a verification link.",
    });
  } catch (err) {
    console.error("Update email error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
