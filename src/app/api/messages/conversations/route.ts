import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbUserToProfile } from "@/lib/mappers";
import {
  getConversationsForUser,
  getOrCreateDirectConversation,
  getConversationForUser,
  getUserById,
  sendConversationMessage,
  getBlockStatus,
} from "@/lib/db";
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

    const conversations = await getConversationsForUser(session.userId);
    return withCacheControl(
      NextResponse.json({
        conversations: conversations.map((c) => ({
          id: c.id,
          participants: c.participants.map(dbUserToProfile),
          bountyRef: c.bounty_id && c.bounty_title ? { id: c.bounty_id, title: c.bounty_title } : undefined,
          lastMessage: c.last_message
            ? {
              id: c.last_message.id,
              conversationId: c.last_message.conversation_id,
              senderId: c.last_message.sender_id,
              senderName: c.last_message.sender_name,
              senderAvatarUrl:
                c.last_message.sender_avatar_url ||
                `https://i.pravatar.cc/150?u=${encodeURIComponent(c.last_message.sender_id)}`,
              type: c.last_message.type,
              content: c.last_message.content,
              read: c.last_message.read,
              createdAt: c.last_message.created_at,
              editedAt: c.last_message.edited_at ?? null,
              deletedAt: c.last_message.deleted_at ?? null,
              deletedBy: c.last_message.deleted_by ?? null,
            }
            : {
              id: `${c.id}-system`,
              conversationId: c.id,
              senderId: "system",
              senderName: "KinSous",
              senderAvatarUrl: "",
              type: "SYSTEM",
              content: "Conversation started",
              read: true,
              createdAt: c.updated_at,
              editedAt: null,
              deletedAt: null,
              deletedBy: null,
            },
          unreadCount: c.unread_count,
          updatedAt: c.updated_at,
          blockedByMe: c.blocked_by_me ?? false,
          blockedByOther: c.blocked_by_other ?? false,
        })),
      }),
      CACHE_POLICY.privateSWR,
      { varyCookie: true }
    );
  } catch (err) {
    console.error("GET /api/messages/conversations error:", err);
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
    const helperId =
      typeof body?.helperId === "string"
        ? body.helperId
        : typeof body?.userId === "string"
          ? body.userId
          : typeof body?.recipientId === "string"
            ? body.recipientId
            : null;
    const bountyId = typeof body?.bountyId === "string" ? body.bountyId : null;
    if (!helperId) {
      return NextResponse.json({ error: "recipientId is required" }, { status: 400 });
    }
    if (helperId === session.userId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const target = await getUserById(helperId);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const blockStatus = await getBlockStatus(session.userId, helperId);
    if (blockStatus.blockedByMe || blockStatus.blockedByOther) {
      return NextResponse.json({ error: "Messaging is blocked" }, { status: 403 });
    }

    const conversationId = await getOrCreateDirectConversation({
      userId: session.userId,
      otherUserId: helperId,
      bountyId,
    });

    const conversation = await getConversationForUser(conversationId, session.userId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation unavailable" }, { status: 404 });
    }

    if (!conversation.last_message) {
      await sendConversationMessage({
        conversationId,
        senderId: session.userId,
        type: "SYSTEM",
        content: "Conversation started",
      });
    }

    return NextResponse.json({ conversationId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
