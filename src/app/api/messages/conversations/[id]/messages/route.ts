import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createNotification,
  deletePushSubscription,
  getConversationForUser,
  listPushSubscriptions,
  sendConversationMessage,
} from "@/lib/db";
import { publishConversationEvent, publishUserEvent } from "@/lib/realtime";
import { sendPushNotifications } from "@/lib/push";

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
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const type = body?.type === "IMAGE" ? "IMAGE" : "TEXT";

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const conversation = await getConversationForUser(id, session.userId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.blocked_by_me || conversation.blocked_by_other) {
      return NextResponse.json({ error: "Messaging is blocked" }, { status: 403 });
    }

    const message = await sendConversationMessage({
      conversationId: id,
      senderId: session.userId,
      type,
      content,
    });

    if (!message) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const mappedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: message.sender_name,
      senderAvatarUrl:
        message.sender_avatar_url ||
        `https://i.pravatar.cc/150?u=${encodeURIComponent(message.sender_id)}`,
      type: message.type,
      content: message.content,
      read: message.read,
      createdAt: message.created_at,
      editedAt: message.edited_at ?? null,
      deletedAt: message.deleted_at ?? null,
      deletedBy: message.deleted_by ?? null,
    };

    publishConversationEvent(id, { type: "message", payload: mappedMessage });

    const other = conversation.participants.find((p) => p.id !== session.userId);
    if (other) {
      const notification = await createNotification({
        userId: other.id,
        type: "NEW_MESSAGE",
        title: `Message from ${message.sender_name}`,
        body: message.type === "IMAGE" ? "📷 Sent a photo" : message.content,
        avatarUrl:
          message.sender_avatar_url ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(message.sender_id)}`,
        href: `/messages/${id}`,
      });

      publishUserEvent(other.id, {
        type: "notification",
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          avatarUrl: notification.avatar_url ?? undefined,
          href: notification.href ?? undefined,
          read: notification.read,
          createdAt: notification.created_at,
        },
      });
      publishUserEvent(other.id, { type: "conversation_updated", payload: { conversationId: id } });
      publishUserEvent(session.userId, { type: "conversation_updated", payload: { conversationId: id } });

      const subs = await listPushSubscriptions(other.id);
      const pushSubscriptions = subs.map((sub) => ({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }));
      const { invalidEndpoints } = await sendPushNotifications(pushSubscriptions, {
        title: notification.title,
        body: notification.body,
        url: notification.href,
      });
      await Promise.all(
        invalidEndpoints.map((endpoint) => deletePushSubscription(other.id, endpoint))
      );
    }

    return NextResponse.json({ message: mappedMessage }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages/conversations/[id]/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
