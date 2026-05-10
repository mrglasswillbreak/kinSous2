import { NextResponse } from "next/server";
import { hashPassword, makeSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { ensureAuthSchema, neonQuery } from "@/lib/neon";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    await ensureAuthSchema();
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await neonQuery<{ id: number }>("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.length) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const inserted = await neonQuery<{ id: number }>(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [String(name).trim(), normalizedEmail, hashPassword(String(password))],
    );

    const token = makeSessionToken();
    await neonQuery("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, inserted[0].id]);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", secure: true });
    return res;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
