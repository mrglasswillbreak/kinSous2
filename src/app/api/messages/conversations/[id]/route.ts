import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbUserToProfile } from "@/lib/mappers";
import {
  getConversationForUser,
  listMessagesForConversation,
  markConversationRead,
} from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await getConversationForUser(id, session.userId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await markConversationRead(id, session.userId);
    const messages = await listMessagesForConversation(id, session.userId);

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        participants: conversation.participants.map(dbUserToProfile),
        bountyRef:
          conversation.bounty_id && conversation.bounty_title
            ? { id: conversation.bounty_id, title: conversation.bounty_title }
            : undefined,
        unreadCount: 0,
        updatedAt: conversation.updated_at,
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
      })),
    });
  } catch (err) {
    console.error("GET /api/messages/conversations/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
