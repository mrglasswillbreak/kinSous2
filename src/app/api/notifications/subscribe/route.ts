import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deletePushSubscription, upsertPushSubscription } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    const p256dh =
      typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : null;
    const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : null;

    let safeEndpoint = false;
    try {
      const u = new URL(endpoint || "");
      safeEndpoint =
        u.protocol === "https:" &&
        [
          ".push.apple.com",
          ".notify.windows.com",
          ".push.services.mozilla.com",
          "fcm.googleapis.com",
        ].some(
          (host) =>
            u.hostname === host ||
            (host.startsWith(".") && u.hostname.endsWith(host)),
        );
    } catch {}
    if (
      !safeEndpoint ||
      !endpoint ||
      !p256dh ||
      !auth ||
      p256dh.length > 200 ||
      auth.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 },
      );
    }

    await upsertPushSubscription({
      userId: session.userId,
      endpoint,
      p256dh,
      auth,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/notifications/subscribe error:", err);
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
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    await deletePushSubscription(session.userId, endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/notifications/subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
