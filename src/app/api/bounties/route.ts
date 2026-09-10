import { publicBounty } from "@/lib/public-data";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getBounties, createBounty } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/server-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const query = searchParams.get("q") ?? undefined;
    const seekerId = searchParams.get("seekerId") ?? undefined;
    const helperId = searchParams.get("helperId") ?? undefined;

    const bounties = await getBounties({
      category,
      status,
      query,
      seekerId,
      helperId,
    });
    const session = await getSession();
    return NextResponse.json({
      bounties: bounties.map((b) => publicBounty(b, session?.userId)),
    });
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
    const {
      title,
      description,
      category,
      budget,
      currency,
      address,
      city,
      country,
      tags,
    } = body;

    if (!title || !description || !category || !budget || !city) {
      return NextResponse.json(
        {
          error: "title, description, category, budget, and city are required",
        },
        { status: 400 },
      );
    }

    if ((currency ?? "NGN") !== "NGN" || (country ?? "Nigeria") !== "Nigeria")
      return NextResponse.json(
        { error: "New orders are available in Nigeria, in NGN" },
        { status: 400 },
      );
    if (
      typeof title !== "string" ||
      title.trim().length < 10 ||
      title.length > 160 ||
      typeof description !== "string" ||
      description.trim().length < 20 ||
      description.length > 5000 ||
      typeof city !== "string" ||
      ![
        "GROCERY",
        "COOKING",
        "CATERING",
        "INGREDIENT_SOURCING",
        "RECIPE_HELP",
        "OTHER",
      ].includes(category)
    )
      return NextResponse.json(
        { error: "Check the bounty details" },
        { status: 400 },
      );
    if (
      !Number.isFinite(Number(budget)) ||
      Number(budget) <= 0 ||
      Number(budget) > 10000000
    ) {
      return NextResponse.json(
        { error: "Budget must be greater than 0" },
        { status: 400 },
      );
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
