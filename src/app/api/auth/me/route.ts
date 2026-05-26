import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { CACHE_POLICY, withCacheControl } from "@/lib/cache-policy";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return withCacheControl(
      NextResponse.json({ user: null }, { status: 401 }),
      CACHE_POLICY.privateNoStore,
      { varyCookie: true }
    );
  }

  const dbUser = await getUserById(session.userId).catch(() => null);
  if (!dbUser) {
    return withCacheControl(
      NextResponse.json({ user: null }, { status: 401 }),
      CACHE_POLICY.privateNoStore,
      { varyCookie: true }
    );
  }

  return withCacheControl(
    NextResponse.json({
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
    }),
    CACHE_POLICY.privateSWR,
    { varyCookie: true }
  );
}
