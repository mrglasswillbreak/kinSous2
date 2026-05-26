import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  acceptBid,
  createNotification,
  getBidById,
  getBountyById,
  getOrCreateDirectConversation,
  sendConversationMessage,
} from "@/lib/db";
import { getSession } from "@/lib/auth";
import { publishUserEvent } from "@/lib/realtime";
import { CACHE_TAGS } from "@/lib/server-data";

interface RouteContext {
  params: Promise<{ id: string; bidId: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, bidId } = await params;
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (bounty.seeker_id !== session.userId) {
      return NextResponse.json({ error: "Only the bounty poster can accept bids" }, { status: 403 });
    }

    const existingBid = await getBidById(bidId);
    if (!existingBid || existingBid.bounty_id !== id) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }
    if (bounty.status !== "OPEN") {
      return NextResponse.json({ error: "This bounty already has a selected bidder" }, { status: 409 });
    }

    const bid = await acceptBid({ bountyId: id, bidId, seekerId: session.userId });
    if (!bid) {
      return NextResponse.json({ error: "Bid could not be accepted" }, { status: 409 });
    }

    const conversationId = await getOrCreateDirectConversation({
      userId: session.userId,
      otherUserId: bid.helper_id,
      bountyId: id,
    });

    await sendConversationMessage({
      conversationId,
      senderId: session.userId,
      type: "SYSTEM",
      content: `Bid accepted for ${bounty.title}. You can now coordinate details here.`,
    });

    const notification = await createNotification({
      userId: bid.helper_id,
      type: "BID_ACCEPTED",
      title: "Your bid was accepted",
      body: `Your bid on “${bounty.title}” has been accepted.`,
      href: `/bounties/${id}`,
    });
    publishUserEvent(bid.helper_id, {
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
    publishUserEvent(bid.helper_id, {
      type: "conversation_updated",
      payload: { conversationId },
    });

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json({ bid, conversationId }, { status: 200 });
  } catch (err) {
    console.error("POST /api/bounties/[id]/bids/[bidId]/accept error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
