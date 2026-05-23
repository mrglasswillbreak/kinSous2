import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPresenceForUsers, listConversationIdsForUser, upsertUserPresence } from "@/lib/db";
import { publishConversationEvent } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("userIds")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    const presence = await getPresenceForUsers(ids);
    return NextResponse.json({
      presence: presence.map((p) => ({
        userId: p.user_id,
        status: p.status,
        lastSeen: p.last_seen,
      })),
    });
  } catch (err) {
    console.error("GET /api/presence error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const status = typeof body?.status === "string" ? body.status : "ONLINE";
    const presence = await upsertUserPresence({ userId: session.userId, status });

    const conversationIds = await listConversationIdsForUser(session.userId);
    conversationIds.forEach((conversationId) => {
      publishConversationEvent(conversationId, {
        type: "presence",
        payload: {
          userId: presence.user_id,
          status: presence.status,
          lastSeen: presence.last_seen,
        },
      });
    });

    return NextResponse.json({
      presence: {
        userId: presence.user_id,
        status: presence.status,
        lastSeen: presence.last_seen,
      },
    });
  } catch (err) {
    console.error("POST /api/presence error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
