import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const GENDERS = new Set(["female", "male", "non_binary", "prefer_not_to_say"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return "";
  }

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

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const {
      contactMethod,
      dateOfBirth,
      email,
      firstName,
      gender,
      lastName,
      password,
      phone,
    } = await req.json();

    const cleanFirstName = String(firstName ?? "").trim();
    const cleanLastName = String(lastName ?? "").trim();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedPhone = normalizePhone(String(phone ?? ""));
    const selectedContactMethod = contactMethod === "phone" ? "phone" : "email";
    const accountEmail = selectedContactMethod === "email" ? normalizedEmail : "";
    const accountPhone = selectedContactMethod === "phone" ? normalizedPhone : "";
    const birthDate = String(dateOfBirth ?? "").trim();
    const selectedGender = String(gender ?? "").trim();

    if (!cleanFirstName || !cleanLastName) {
      return NextResponse.json(
        { error: "First and last name are required" },
        { status: 400 }
      );
    }

    if (selectedContactMethod === "email" && !accountEmail) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (accountEmail && !EMAIL_PATTERN.test(accountEmail)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    if (selectedContactMethod === "phone" && !accountPhone) {
      return NextResponse.json(
        { error: "Enter a valid phone number" },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 }
      );
    }

    const age = getAge(birthDate);
    if (age === null || age < 13 || age > 120) {
      return NextResponse.json(
        { error: "Enter a valid date of birth" },
        { status: 400 }
      );
    }

    if (!GENDERS.has(selectedGender)) {
      return NextResponse.json(
        { error: "Select a gender option" },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (accountEmail) {
      const existingEmail = await sql`
        SELECT id FROM users WHERE lower(email) = ${accountEmail}
      `;
      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    if (accountPhone) {
      const existingPhone = await sql`
        SELECT id FROM users WHERE phone = ${accountPhone}
      `;
      if (existingPhone.length > 0) {
        return NextResponse.json(
          { error: "An account with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    if (!accountEmail && !accountPhone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const name = `${cleanFirstName} ${cleanLastName}`;

    const rows = await sql`
      INSERT INTO users (
        email,
        phone,
        name,
        first_name,
        last_name,
        date_of_birth,
        gender,
        password_hash,
        role
      )
      VALUES (
        ${accountEmail || null},
        ${accountPhone || null},
        ${name},
        ${cleanFirstName},
        ${cleanLastName},
        ${birthDate},
        ${selectedGender},
        ${passwordHash},
        'SEEKER'
      )
      RETURNING id, email, phone, name, first_name, last_name, date_of_birth, gender, role
    `;

    const user = rows[0];

    await setSessionCookie({
      userId: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          dateOfBirth: user.date_of_birth,
          gender: user.gender,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    if (err instanceof Error && err.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "Database is not configured. Add DATABASE_URL to .env.local." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
