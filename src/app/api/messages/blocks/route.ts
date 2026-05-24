import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { blockUser, unblockUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : null;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (userId === session.userId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    await blockUser(session.userId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/messages/blocks error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : null;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await unblockUser(session.userId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/messages/blocks error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
