import { publicUser } from "@/lib/public-data";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbUserToProfile } from "@/lib/mappers";
import {
  getConversationForUser,
  listMessagesForConversation,
  markConversationRead,
  listTypingForConversation,
  getPresenceForUsers,
} from "@/lib/db";
import { publishConversationEvent, publishUserEvent } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          error: "Not authenticated",
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const conversation = await getConversationForUser(id, session.userId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    await markConversationRead(id, session.userId);
    publishConversationEvent(id, {
      type: "read",
      payload: { readerId: session.userId },
    });
    publishUserEvent(session.userId, {
      type: "conversation_updated",
      payload: { conversationId: id },
    });
    const before = new URL(_req.url).searchParams.get("before") || undefined;
    const messages = await listMessagesForConversation(
      id,
      session.userId,
      before,
    );
    const typing = await listTypingForConversation(id);
    const presence = await getPresenceForUsers(
      conversation.participants.map((p) => p.id),
    );

    return NextResponse.json({
      nextCursor: messages.length === 50 ? messages[0].id : null,
      conversation: {
        id: conversation.id,
        participants: conversation.participants.map((u) =>
          dbUserToProfile(publicUser(u)),
        ),
        bountyRef:
          conversation.bounty_id && conversation.bounty_title
            ? { id: conversation.bounty_id, title: conversation.bounty_title }
            : undefined,
        unreadCount: 0,
        updatedAt: conversation.updated_at,
        blockedByMe: conversation.blocked_by_me ?? false,
        blockedByOther: conversation.blocked_by_other ?? false,
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatarUrl:
          m.sender_avatar_url ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(m.sender_id)}`,
        type: m.type,
        content: m.content,
        read: m.read,
        createdAt: m.created_at,
        editedAt: m.edited_at ?? null,
        deletedAt: m.deleted_at ?? null,
        deletedBy: m.deleted_by ?? null,
      })),
      typing: typing.map((t) => ({
        userId: t.user_id,
        isTyping: t.is_typing,
        updatedAt: t.updated_at,
      })),
      presence: presence.map((p) => ({
        userId: p.user_id,
        status: p.status,
        lastSeen: p.last_seen,
      })),
    });
  } catch (err) {
    console.error("GET /api/messages/conversations/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
