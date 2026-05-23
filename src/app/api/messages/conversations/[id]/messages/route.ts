import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendConversationMessage } from "@/lib/db";

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
    if (type === "TEXT" && content.length > 2000) {
      return NextResponse.json({ error: "Message exceeds 2000 characters" }, { status: 400 });
    }
    if (type === "IMAGE") {
      const isSafeDataImage = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(content);
      const isHttpsUrl = /^https:\/\//i.test(content);
      if (!isSafeDataImage && !isHttpsUrl) {
        return NextResponse.json({ error: "Unsupported image payload" }, { status: 400 });
      }
      if (content.length > 4_000_000) {
        return NextResponse.json({ error: "Image payload too large" }, { status: 400 });
      }
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

    return NextResponse.json({
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderAvatarUrl:
          message.sender_avatar_url ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(message.sender_id)}`,
        type: message.type,
        content: message.content,
        read: true,
        createdAt: message.created_at,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages/conversations/[id]/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
