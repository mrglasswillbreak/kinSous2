import { NextRequest, NextResponse } from "next/server";
import { getBountyById } from "@/lib/db";

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
