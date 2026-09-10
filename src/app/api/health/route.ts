import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { logDatabaseFailure } from "@/lib/service-diagnostics";
export async function GET() {
  if (!process.env.DATABASE_URL) {
    console.error(JSON.stringify({ event: "health_configuration_missing", setting: "DATABASE_URL" }));
    return NextResponse.json(
      {
        status:
          process.env.NODE_ENV === "production" ? "unavailable" : "development",
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 },
    );
  }
  try {
    const rows =
      await sql`SELECT name FROM schema_migrations WHERE name='008_bounty_conversations.sql'`;
    if (!rows.length) {
      console.error(JSON.stringify({ event: "health_migrations_pending", required: "008_bounty_conversations.sql" }));
      return NextResponse.json({ status: "unavailable" }, { status: 503 });
    }
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      console.error(JSON.stringify({ event: "health_configuration_invalid", setting: "AUTH_SECRET" }));
      return NextResponse.json({ status: "unavailable" }, { status: 503 });
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logDatabaseFailure("health", error);
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
