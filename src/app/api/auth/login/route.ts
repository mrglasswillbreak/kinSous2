import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return "";
  }

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const { email, identifier, password } = await req.json();
    const loginIdentifier = String(identifier ?? email ?? "").trim();
    const normalizedEmail = loginIdentifier.toLowerCase();
    const normalizedPhone = normalizePhone(loginIdentifier);

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Email or phone number and password are required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, email, phone, name, password_hash, role, avatar_url
      FROM users
      WHERE lower(email) = ${normalizedEmail}
        OR phone = ${normalizedPhone || null}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Database is not configured. Add DATABASE_URL to .env.local." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
