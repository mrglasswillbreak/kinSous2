import { sql, usingLocalDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { cancelBounty, createNotification, getBountyById } from "@/lib/db";
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
        { error: "Only the bounty poster can cancel this bounty" },
        { status: 403 },
      );
    }

    const cancelled = await cancelBounty({
      bountyId: id,
      seekerId: session.userId,
    });
    if (!cancelled) {
      return NextResponse.json(
        {
          error: "This bounty can only be cancelled before any bid is accepted",
        },
        { status: 409 },
      );
    }

    for (const helperId of cancelled.notifiedHelperIds) {
      const notification = await createNotification({
        userId: helperId,
        type: "SYSTEM",
        title: "Bounty cancelled",
        body: `“${cancelled.bounty.title}” was cancelled by the poster.`,
        href: `/bounties/${id}`,
      });
      publishUserEvent(helperId, {
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
    }

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json(
      {
        bounty: cancelled.bounty,
        notifiedHelpers: cancelled.notifiedHelperIds.length,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/bounties/[id]/cancel error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
