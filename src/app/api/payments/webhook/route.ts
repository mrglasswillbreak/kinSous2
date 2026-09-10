import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPayment } from "@/lib/payments";
export async function POST(req: Request) {
  const secret = process.env.FLW_SECRET_HASH;
  const signature = req.headers.get("verif-hash");
  if (
    !secret ||
    !signature ||
    Buffer.byteLength(signature) !== Buffer.byteLength(secret) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(secret))
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 100000)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  try {
    const payload = JSON.parse(raw);
    const id = createHash("sha256").update(raw).digest("hex");
    const prior =
      await sql`SELECT processed_at FROM webhook_events WHERE id=${id}`;
    if (prior[0]?.processed_at) return NextResponse.json({ ok: true });
    // Retain only reconciliation metadata, never card/customer details.
    const event = {
      event: payload.event,
      id: payload.data?.id,
      reference: payload.data?.tx_ref,
    };
    await sql`INSERT INTO webhook_events(id,payload) VALUES(${id},${JSON.stringify(event)}::jsonb) ON CONFLICT DO NOTHING`;
    if (payload.event === "charge.completed")
      await verifyPayment(String(payload.data?.id));
    await sql`UPDATE webhook_events SET processed_at=now() WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "payment_webhook_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Verification pending" },
      { status: 503 },
    );
  }
}
