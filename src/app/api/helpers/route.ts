import { NextRequest, NextResponse } from "next/server";
import { getHelpers } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") ?? undefined;
    const helpers = await getHelpers(query);
    return NextResponse.json({ helpers });
  } catch (err) {
    console.error("GET /api/helpers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
