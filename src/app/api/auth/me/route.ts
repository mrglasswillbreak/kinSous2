import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const dbUser = await getUserById(session.userId).catch(() => null);
  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      userId: dbUser.id,
      email: dbUser.email,
      phone: dbUser.phone,
      name: dbUser.name,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      dateOfBirth: dbUser.date_of_birth,
      gender: dbUser.gender,
      role: dbUser.role,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      city: dbUser.city,
      country: dbUser.country,
      countryCode: dbUser.country_code,
    },
  });
}
