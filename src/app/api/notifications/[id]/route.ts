import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dismissNotification, markNotificationRead } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await markNotificationRead(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/notifications/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    await dismissNotification(session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notifications/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
