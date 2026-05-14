import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";

/**
 * POST /api/auth/seed
 * Creates the default demo account (idempotent).
 * Call this once after connecting your Neon database.
 */
export async function POST() {
  try {
    await initDb();

    const email = "chioma@kinsous.com";
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ message: "Default user already exists" });
    }

    const passwordHash = await bcrypt.hash("KinSous2024!", 12);
    await sql`
      INSERT INTO users (
        email,
        name,
        first_name,
        last_name,
        password_hash,
        role,
        avatar_url,
        bio,
        city,
        country,
        country_code
      )
      VALUES (
        ${email},
        'Chioma Nwosu',
        'Chioma',
        'Nwosu',
        ${passwordHash},
        'SEEKER',
        'https://i.pravatar.cc/150?img=23',
        'Exploring authentic ingredients and home-style West African cooking.',
        'Lagos',
        'Nigeria',
        'NG'
      )
    `;

    return NextResponse.json({ message: "Default user created", email, password: "KinSous2024!" });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
