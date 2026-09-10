import { sql, usingLocalDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createNotification,
  getBountyById,
  getOrCreateDirectConversation,
  markBountyIncomplete,
  sendConversationMessage,
} from "@/lib/db";
import { publishUserEvent } from "@/lib/realtime";
import { CACHE_TAGS } from "@/lib/server-data";

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
    if (!usingLocalDb()) {
      const orders = await sql`SELECT id FROM orders WHERE id=${id}`;
      if (orders.length)
        return NextResponse.json(
          {
            error: "Report an issue from the order page for manual resolution",
          },
          { status: 409 },
        );
    }
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (bounty.seeker_id !== session.userId) {
      return NextResponse.json(
        { error: "Only the bounty poster can mark this bounty incomplete" },
        { status: 403 },
      );
    }

    const updated = await markBountyIncomplete({
      bountyId: id,
      seekerId: session.userId,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "This bounty cannot be marked incomplete right now" },
        { status: 409 },
      );
    }

    const conversationId = await getOrCreateDirectConversation({
      userId: session.userId,
      otherUserId: updated.acceptedBid.helper_id,
      bountyId: id,
    });

    await sendConversationMessage({
      conversationId,
      senderId: session.userId,
      type: "SYSTEM",
      content: `Bounty marked as incomplete for ${updated.bounty.title}. Please resolve the issue in this chat.`,
    });

    const notification = await createNotification({
      userId: updated.acceptedBid.helper_id,
      type: "SYSTEM",
      title: "Bounty marked incomplete",
      body: `The poster reported an issue with “${updated.bounty.title}”.`,
      href: `/bounties/${id}`,
    });
    publishUserEvent(updated.acceptedBid.helper_id, {
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
    publishUserEvent(updated.acceptedBid.helper_id, {
      type: "conversation_updated",
      payload: { conversationId },
    });

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json(
      {
        bounty: updated.bounty,
        acceptedBid: updated.acceptedBid,
        conversationId,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/bounties/[id]/incomplete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
