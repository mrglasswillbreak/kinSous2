import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getConversationForUser,
  listTypingForConversation,
  upsertConversationTyping,
} from "@/lib/db";
import { publishConversationEvent } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const isTyping = Boolean(body?.isTyping);

    const conversation = await getConversationForUser(id, session.userId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.blocked_by_me || conversation.blocked_by_other) {
      return NextResponse.json({ error: "Messaging is blocked" }, { status: 403 });
    }

    await upsertConversationTyping({ conversationId: id, userId: session.userId, isTyping });
    const typing = await listTypingForConversation(id);
    publishConversationEvent(id, {
      type: "typing",
      payload: typing.map((t) => ({
        userId: t.user_id,
        isTyping: t.is_typing,
        updatedAt: t.updated_at,
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/messages/conversations/[id]/typing error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
