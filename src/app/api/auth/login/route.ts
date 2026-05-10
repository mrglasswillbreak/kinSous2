import { NextResponse } from "next/server";
import { hashPassword, makeSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { ensureAuthSchema, neonQuery } from "@/lib/neon";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "email and password are required" }, { status: 400 });

    await ensureAuthSchema();
    const normalizedEmail = String(email).toLowerCase().trim();

    await neonQuery(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('KinSous Demo', 'demo@kinsous.app', $1)
       ON CONFLICT (email) DO NOTHING`,
      [hashPassword("Demo@1234")],
    );

    const rows = await neonQuery<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE email = $1", [normalizedEmail]);
    if (!rows.length || rows[0].password_hash !== hashPassword(String(password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = makeSessionToken();
    await neonQuery("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, rows[0].id]);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", secure: true });
    return res;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
