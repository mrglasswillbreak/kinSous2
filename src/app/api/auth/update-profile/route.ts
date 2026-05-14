import { NextRequest, NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth";
import { initDb, sql } from "@/lib/db";

const MAX_NAME_LEN = 100;
const MAX_BIO_LEN = 500;
const MAX_CITY_LEN = 100;
const MAX_COUNTRY_LEN = 100;
const MAX_COUNTRY_CODE_LEN = 10;
const MAX_AVATAR_LEN = 900_000;
const GENDERS = new Set(["female", "male", "non_binary", "prefer_not_to_say"]);

function isValidProfileImage(value: string): boolean {
  if (value.startsWith("data:image/")) {
    return (
      value.length <= MAX_AVATAR_LEN &&
      /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
    );
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "";

  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function getAge(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;

  const dob = new Date(year, month - 1, day);
  const isValidDate =
    dob.getFullYear() === year &&
    dob.getMonth() === month - 1 &&
    dob.getDate() === day;
  if (!isValidDate) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);

  if (!hasBirthdayPassed) age -= 1;
  return age;
}

function cleanNullable(value: unknown) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const {
      avatarUrl,
      bio,
      city,
      country,
      countryCode,
      dateOfBirth,
      firstName,
      gender,
      lastName,
      name,
      phone,
    } = await req.json();

    const cleanFirstName = cleanNullable(firstName);
    const cleanLastName = cleanNullable(lastName);
    const displayName =
      cleanNullable(name) ??
      [cleanFirstName, cleanLastName].filter(Boolean).join(" ").trim();
    const cleanBio = cleanNullable(bio);
    const cleanCity = cleanNullable(city);
    const cleanCountry = cleanNullable(country);
    const cleanCountryCode = cleanNullable(countryCode);
    const cleanAvatarUrl = cleanNullable(avatarUrl);
    const cleanDateOfBirth = cleanNullable(dateOfBirth);
    const cleanGender = cleanNullable(gender);
    const normalizedPhone = normalizePhone(String(phone ?? ""));

    if (!displayName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (displayName.length > MAX_NAME_LEN) {
      return NextResponse.json(
        { error: `Name must be at most ${MAX_NAME_LEN} characters` },
        { status: 400 }
      );
    }

    if (cleanBio && cleanBio.length > MAX_BIO_LEN) {
      return NextResponse.json(
        { error: `Bio must be at most ${MAX_BIO_LEN} characters` },
        { status: 400 }
      );
    }

    if (cleanCity && cleanCity.length > MAX_CITY_LEN) {
      return NextResponse.json(
        { error: `City must be at most ${MAX_CITY_LEN} characters` },
        { status: 400 }
      );
    }

    if (cleanCountry && cleanCountry.length > MAX_COUNTRY_LEN) {
      return NextResponse.json(
        { error: `Country must be at most ${MAX_COUNTRY_LEN} characters` },
        { status: 400 }
      );
    }

    if (cleanCountryCode && cleanCountryCode.length > MAX_COUNTRY_CODE_LEN) {
      return NextResponse.json(
        { error: `Country code must be at most ${MAX_COUNTRY_CODE_LEN} characters` },
        { status: 400 }
      );
    }

    if (cleanAvatarUrl && !isValidProfileImage(cleanAvatarUrl)) {
      return NextResponse.json(
        { error: "Use an HTTPS image URL or a supported image upload" },
        { status: 400 }
      );
    }

    if (normalizedPhone === "") {
      return NextResponse.json(
        { error: "Enter a valid phone number" },
        { status: 400 }
      );
    }

    if (normalizedPhone) {
      const existingPhone = await sql`
        SELECT id FROM users
        WHERE phone = ${normalizedPhone}
          AND id != ${session.userId}
        LIMIT 1
      `;

      if (existingPhone.length > 0) {
        return NextResponse.json(
          { error: "This phone number is already in use" },
          { status: 409 }
        );
      }
    }

    if (cleanDateOfBirth) {
      const age = getAge(cleanDateOfBirth);
      if (age === null || age < 13 || age > 120) {
        return NextResponse.json(
          { error: "Enter a valid date of birth" },
          { status: 400 }
        );
      }
    }

    if (cleanGender && !GENDERS.has(cleanGender)) {
      return NextResponse.json(
        { error: "Select a valid gender option" },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE users
      SET
        name          = ${displayName},
        first_name    = ${cleanFirstName},
        last_name     = ${cleanLastName},
        phone         = ${normalizedPhone},
        date_of_birth = ${cleanDateOfBirth},
        gender        = ${cleanGender},
        bio           = ${cleanBio},
        city          = ${cleanCity},
        country       = ${cleanCountry},
        country_code  = ${cleanCountryCode},
        avatar_url    = ${cleanAvatarUrl}
      WHERE id = ${session.userId}
      RETURNING id, email, phone, name, role
    `;

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
