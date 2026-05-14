import { NextRequest, NextResponse } from "next/server";
import { initDb, sql } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

const ALLOWED_ROLES = new Set(["SEEKER", "HELPER"]);

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Role must be SEEKER or HELPER" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE users
      SET role = ${role}
      WHERE id = ${session.userId}
      RETURNING email, phone, name
    `;
    const user = rows[0];

    // Refresh session cookie with new role
    await setSessionCookie({
      userId: session.userId,
      email: user?.email ?? session.email,
      phone: user?.phone ?? session.phone ?? null,
      name: user?.name ?? session.name,
      role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
