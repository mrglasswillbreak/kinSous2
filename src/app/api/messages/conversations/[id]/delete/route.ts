import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteConversationForUser } from "@/lib/db";
import { publishUserEvent } from "@/lib/realtime";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await deleteConversationForUser(id, session.userId);
    publishUserEvent(session.userId, { type: "conversation_deleted", payload: { conversationId: id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/messages/conversations/[id]/delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
