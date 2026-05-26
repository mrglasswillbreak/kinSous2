import { NextRequest, NextResponse } from "next/server";
import { getHelpers } from "@/lib/db";
import { CACHE_POLICY, withCacheControl } from "@/lib/cache-policy";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") ?? undefined;
    const helpers = await getHelpers(query);
    return withCacheControl(NextResponse.json({ helpers }), CACHE_POLICY.publicSWR);
  } catch (err) {
    console.error("GET /api/helpers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
