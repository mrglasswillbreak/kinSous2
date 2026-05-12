import { NextRequest, NextResponse } from "next/server";
import { deleteBounty, getBountyById, updateBounty } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const bounty = await getBountyById(id);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    return NextResponse.json({ bounty });
  } catch (err) {
    console.error("GET /api/bounties/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const ALLOWED_CATEGORIES = new Set([
  "GROCERY",
  "COOKING",
  "CATERING",
  "INGREDIENT_SOURCING",
  "RECIPE_HELP",
  "OTHER",
]);
const ALLOWED_STATUSES = new Set([
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_APPROVAL",
  "COMPLETED",
  "CANCELLED",
]);
const ALLOWED_CURRENCIES = new Set(["NGN", "USD"]);

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getBountyById(id);
    if (!existing) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (existing.seeker_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: {
      title?: string;
      description?: string;
      category?: string;
      status?: string;
      budget?: number;
      currency?: string;
      address?: string;
      city?: string;
      country?: string;
      tags?: string[];
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
      updates.title = title;
    }
    if (body.description !== undefined) {
      const description = String(body.description).trim();
      if (!description) return NextResponse.json({ error: "description cannot be empty" }, { status: 400 });
      updates.description = description;
    }
    if (body.category !== undefined) {
      const category = String(body.category);
      if (!ALLOWED_CATEGORIES.has(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updates.category = category;
    }
    if (body.status !== undefined) {
      const status = String(body.status);
      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }
    if (body.budget !== undefined) {
      const budget = Number(body.budget);
      if (!Number.isFinite(budget) || budget <= 0) {
        return NextResponse.json({ error: "Budget must be greater than 0" }, { status: 400 });
      }
      updates.budget = budget;
    }
    if (body.currency !== undefined) {
      const currency = String(body.currency);
      if (!ALLOWED_CURRENCIES.has(currency)) {
        return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
      }
      updates.currency = currency;
    }
    if (body.address !== undefined) {
      updates.address = String(body.address).trim();
    }
    if (body.city !== undefined) {
      const city = String(body.city).trim();
      if (!city) return NextResponse.json({ error: "city cannot be empty" }, { status: 400 });
      updates.city = city;
    }
    if (body.country !== undefined) {
      updates.country = String(body.country).trim();
    }
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
      }
      updates.tags = (body.tags as unknown[])
        .map((t: unknown) => String(t).trim())
        .filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const bounty = await updateBounty(id, session.userId, updates);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    return NextResponse.json({ bounty });
  } catch (err) {
    console.error("PATCH /api/bounties/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getBountyById(id);
    if (!existing) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    if (existing.seeker_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = await deleteBounty(id, session.userId);
    if (!deleted) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bounties/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
