import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteConversationMessage, getConversationForUser, updateConversationMessage } from "@/lib/db";
import { publishConversationEvent, publishUserEvent } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ id: string; messageId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, messageId } = await params;
    const body = await req.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const message = await updateConversationMessage({
      conversationId: id,
      messageId,
      userId: session.userId,
      content,
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
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

    publishConversationEvent(id, { type: "message_updated", payload: mappedMessage });
    const conversation = await getConversationForUser(id, session.userId);
    if (conversation) {
      conversation.participants.forEach((participant) => {
        publishUserEvent(participant.id, { type: "conversation_updated", payload: { conversationId: id } });
      });
    }

    return NextResponse.json({ message: mappedMessage });
  } catch (err) {
    console.error("PATCH /api/messages/conversations/[id]/messages/[messageId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, messageId } = await params;
    const message = await deleteConversationMessage({
      conversationId: id,
      messageId,
      userId: session.userId,
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
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

    publishConversationEvent(id, { type: "message_deleted", payload: mappedMessage });
    const conversation = await getConversationForUser(id, session.userId);
    if (conversation) {
      conversation.participants.forEach((participant) => {
        publishUserEvent(participant.id, { type: "conversation_updated", payload: { conversationId: id } });
      });
    }

    return NextResponse.json({ message: mappedMessage });
  } catch (err) {
    console.error("DELETE /api/messages/conversations/[id]/messages/[messageId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
