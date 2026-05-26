import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createOrUpdateBountyReview,
  getBountyById,
  getReviewByBountyAndAuthor,
} from "@/lib/db";
import { CACHE_TAGS } from "@/lib/server-data";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const review = await getReviewByBountyAndAuthor(id, session.userId);
    return NextResponse.json({ review });
  } catch (err) {
    console.error("GET /api/bounties/[id]/review error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
    if (bounty.seeker_id !== session.userId) {
      return NextResponse.json(
        { error: "Only the bounty poster can leave a review" },
        { status: 403 }
      );
    }
    if (bounty.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Reviews can only be submitted after completion" },
        { status: 409 }
      );
    }

    const acceptedBid = bounty.bids?.find((bid) => bid.status === "ACCEPTED");
    if (!acceptedBid) {
      return NextResponse.json(
        { error: "No accepted helper found for this bounty" },
        { status: 409 }
      );
    }

    const body = await req.json();
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }
    if (!comment) {
      return NextResponse.json({ error: "Review comment is required" }, { status: 400 });
    }

    const review = await createOrUpdateBountyReview({
      bountyId: id,
      authorId: session.userId,
      targetId: acceptedBid.helper_id,
      rating,
      comment,
    });
    if (!review) {
      return NextResponse.json({ error: "Unable to submit review" }, { status: 500 });
    }
    revalidateTag(CACHE_TAGS.helpers);
    return NextResponse.json({ review }, { status: 200 });
  } catch (err) {
    console.error("POST /api/bounties/[id]/review error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
