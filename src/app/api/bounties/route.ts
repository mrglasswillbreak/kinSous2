import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getBounties, createBounty } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/server-data";
import { CACHE_POLICY, withCacheControl } from "@/lib/cache-policy";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const query = searchParams.get("q") ?? undefined;
    const seekerId = searchParams.get("seekerId") ?? undefined;
    const helperId = searchParams.get("helperId") ?? undefined;

    const bounties = await getBounties({ category, status, query, seekerId, helperId });
    return withCacheControl(NextResponse.json({ bounties }), CACHE_POLICY.publicSWR);
  } catch (err) {
    console.error("GET /api/bounties error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, budget, currency, address, city, country, tags } = body;

    if (!title || !description || !category || !budget || !city) {
      return NextResponse.json(
        { error: "title, description, category, budget, and city are required" },
        { status: 400 }
      );
    }

    if (Number(budget) <= 0) {
      return NextResponse.json({ error: "Budget must be greater than 0" }, { status: 400 });
    }

    const bounty = await createBounty({
      title: title.trim(),
      description: description.trim(),
      category,
      budget: Number(budget),
      currency: currency ?? "NGN",
      seekerId: session.userId,
      address: address?.trim() ?? "",
      city: city.trim(),
      country: country?.trim() ?? "",
      tags: Array.isArray(tags) ? tags : [],
    });

    revalidateTag(CACHE_TAGS.bounties);
    return NextResponse.json({ bounty }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bounties error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
