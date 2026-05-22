import { NextResponse } from "next/server";
import {
  acceptBid,
  getBidById,
  getBountyById,
  getOrCreateDirectConversation,
  sendConversationMessage,
} from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    return NextResponse.json({ bid, conversationId }, { status: 200 });
  } catch (err) {
    console.error("POST /api/bounties/[id]/bids/[bidId]/accept error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
