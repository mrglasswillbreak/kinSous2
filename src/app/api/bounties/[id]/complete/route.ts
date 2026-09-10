import { sql, usingLocalDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  completeBounty,
  createNotification,
  getBountyById,
  getOrCreateDirectConversation,
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
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (bounty.seeker_id !== session.userId) {
      return NextResponse.json(
        { error: "Only the bounty poster can complete this bounty" },
        { status: 403 },
      );
    }

    if (!usingLocalDb()) {
      const result =
        await sql`SELECT transition_order(${id},${session.userId},'COMPLETED',NULL) AS ok`;
      if (!result[0]?.ok)
        return NextResponse.json(
          { error: "Confirm a delivered, paid order from Orders & payments" },
          { status: 409 },
        );
      return NextResponse.json({ success: true });
    }
    const completed = await completeBounty({
      bountyId: id,
      seekerId: session.userId,
    });
    if (!completed) {
      return NextResponse.json(
        { error: "This bounty cannot be completed yet" },
        { status: 409 },
      );
    }

    const conversationId = await getOrCreateDirectConversation({
      userId: session.userId,
      otherUserId: completed.acceptedBid.helper_id,
      bountyId: id,
    });

    await sendConversationMessage({
      conversationId,
      senderId: session.userId,
      type: "SYSTEM",
      content: `Bounty marked as complete for ${completed.bounty.title}.`,
    });

    const notification = await createNotification({
      userId: completed.acceptedBid.helper_id,
      type: "SYSTEM",
      title: "Bounty completed",
      body: `The poster marked “${completed.bounty.title}” as complete.`,
      href: `/bounties/${id}`,
    });
    publishUserEvent(completed.acceptedBid.helper_id, {
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
    publishUserEvent(completed.acceptedBid.helper_id, {
      type: "conversation_updated",
      payload: { conversationId },
    });

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json(
      {
        bounty: completed.bounty,
        acceptedBid: completed.acceptedBid,
        conversationId,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/bounties/[id]/complete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
