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
    const passwordHash = await bcrypt.hash("KinSous2024!", 12);
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      await sql`
        UPDATE users
        SET
          name = COALESCE(NULLIF(name, ''), 'Chioma Nwosu'),
          first_name = COALESCE(first_name, 'Chioma'),
          last_name = COALESCE(last_name, 'Nwosu'),
          password_hash = ${passwordHash},
          role = COALESCE(role, 'SEEKER'),
          avatar_url = COALESCE(avatar_url, 'https://i.pravatar.cc/150?img=23'),
          bio = COALESCE(bio, 'Exploring authentic ingredients and home-style West African cooking.'),
          city = COALESCE(city, 'Lagos'),
          country = COALESCE(country, 'Nigeria'),
          country_code = COALESCE(country_code, 'NG')
        WHERE email = ${email}
      `;
      return NextResponse.json({ message: "Default user already exists" });
    }

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
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Database is not configured. Add DATABASE_URL to .env.local." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
