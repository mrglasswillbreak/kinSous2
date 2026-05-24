import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { reportConversationMessage } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;
    const reportedUserId = typeof body?.reportedUserId === "string" ? body.reportedUserId : null;
    const messageId = typeof body?.messageId === "string" ? body.messageId : null;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!conversationId || !reportedUserId || !reason) {
      return NextResponse.json({ error: "Invalid report request" }, { status: 400 });
    }

    await reportConversationMessage({
      conversationId,
      reporterId: session.userId,
      reportedUserId,
      messageId,
      reason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/messages/reports error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
