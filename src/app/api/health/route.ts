import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
export async function GET() {
  if (!process.env.DATABASE_URL)
    return NextResponse.json(
      {
        status:
          process.env.NODE_ENV === "production" ? "unavailable" : "development",
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 },
    );
  try {
    const rows =
      await sql`SELECT name FROM schema_migrations WHERE name='008_bounty_conversations.sql'`;
    if (
      !rows.length ||
      !process.env.AUTH_SECRET ||
      process.env.AUTH_SECRET.length < 32
    )
      return NextResponse.json({ status: "unavailable" }, { status: 503 });
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
