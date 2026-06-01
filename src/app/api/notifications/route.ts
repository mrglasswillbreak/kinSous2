import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNotificationsForUser, markAllNotificationsRead } from "@/lib/db";
import { CACHE_POLICY, withCacheControl } from "@/lib/cache-policy";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return withCacheControl(
        NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
        CACHE_POLICY.privateNoStore,
        { varyCookie: true }
      );
    }

    const notifications = await listNotificationsForUser(session.userId);
    return withCacheControl(
      NextResponse.json({
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          avatarUrl: n.avatar_url ?? undefined,
          href: n.href ?? undefined,
          read: n.read,
          createdAt: n.created_at,
        })),
      }),
      CACHE_POLICY.privateSWR,
      { varyCookie: true }
    );
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await markAllNotificationsRead(session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
