import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createBid, createNotification, getBountyById, getUserById } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { publishUserEvent } from "@/lib/realtime";
import { CACHE_TAGS } from "@/lib/server-data";

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
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (bounty.seeker_id === session.userId) {
      return NextResponse.json({ error: "You cannot bid on your own bounty" }, { status: 403 });
    }
    if (bounty.status !== "OPEN") {
      return NextResponse.json({ error: "This bounty is no longer accepting bids" }, { status: 409 });
    }

    const user = await getUserById(session.userId);
    if (!user || user.role !== "HELPER") {
      return NextResponse.json({ error: "Only helper accounts can place bids" }, { status: 403 });
    }

    const body = await req.json();
    const amount = Number(body?.amount);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const estimatedDeliveryMinutes = Number(body?.estimatedDeliveryMinutes);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Bid amount must be greater than 0" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Bid message is required" }, { status: 400 });
    }
    if (!Number.isFinite(estimatedDeliveryMinutes) || estimatedDeliveryMinutes < 5) {
      return NextResponse.json({ error: "Estimated delivery must be at least 5 minutes" }, { status: 400 });
    }

    const bid = await createBid({
      bountyId: id,
      helperId: session.userId,
      amount,
      message,
      estimatedDeliveryMinutes: Math.round(estimatedDeliveryMinutes),
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid could not be placed" }, { status: 409 });
    }

    const notification = await createNotification({
      userId: bounty.seeker_id,
      type: "NEW_BID",
      title: "New bid received",
      body: `${user.name} placed a bid on “${bounty.title}”.`,
      avatarUrl:
        user.avatar_url ||
        `https://i.pravatar.cc/150?u=${encodeURIComponent(user.id)}`,
      href: `/bounties/${id}`,
    });
    publishUserEvent(bounty.seeker_id, {
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

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json({ bid }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bounties/[id]/bids error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
