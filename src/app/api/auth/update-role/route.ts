import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

const ALLOWED_ROLES = new Set(["SEEKER", "HELPER"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Role must be SEEKER or HELPER" }, { status: 400 });
    }

    await sql`
      UPDATE users SET role = ${role} WHERE id = ${session.userId}
    `;

    // Refresh session cookie with new role
    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      name: session.name,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
