import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";

const MAX_NAME_LEN = 100;
const MAX_BIO_LEN = 500;
const MAX_CITY_LEN = 100;
const MAX_COUNTRY_LEN = 100;
const MAX_COUNTRY_CODE_LEN = 10;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

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

    if (name.trim().length > MAX_NAME_LEN) {
      return NextResponse.json({ error: `Name must be at most ${MAX_NAME_LEN} characters` }, { status: 400 });
    }

    if (bio && bio.length > MAX_BIO_LEN) {
      return NextResponse.json({ error: `Bio must be at most ${MAX_BIO_LEN} characters` }, { status: 400 });
    }

    if (city && city.length > MAX_CITY_LEN) {
      return NextResponse.json({ error: `City must be at most ${MAX_CITY_LEN} characters` }, { status: 400 });
    }

    if (country && country.length > MAX_COUNTRY_LEN) {
      return NextResponse.json({ error: `Country must be at most ${MAX_COUNTRY_LEN} characters` }, { status: 400 });
    }

    if (countryCode && countryCode.length > MAX_COUNTRY_CODE_LEN) {
      return NextResponse.json({ error: `Country code must be at most ${MAX_COUNTRY_CODE_LEN} characters` }, { status: 400 });
    }

    if (avatarUrl && !isValidUrl(avatarUrl)) {
      return NextResponse.json({ error: "Avatar URL must be a valid http/https URL" }, { status: 400 });
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
