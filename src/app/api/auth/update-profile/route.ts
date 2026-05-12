import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, bio, city, country, countryCode, avatarUrl } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await sql`
      UPDATE users
      SET
        name         = ${name.trim()},
        bio          = ${bio ?? null},
        city         = ${city ?? null},
        country      = ${country ?? null},
        country_code = ${countryCode ?? null},
        avatar_url   = ${avatarUrl ?? null}
      WHERE id = ${session.userId}
    `;

    // Refresh session with updated name
    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      name: name.trim(),
      role: session.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
