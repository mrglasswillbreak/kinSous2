import { NextResponse } from "next/server";
import { sql, listPushSubscriptions, deletePushSubscription } from "@/lib/db";
import { sendPushNotifications } from "@/lib/push";
import { flutterwave, processTransfer, verifyPayment } from "@/lib/payments";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const failures: string[] = [];
  const started = Date.now();
  const payments =
    await sql`SELECT id FROM payments WHERE status='PENDING' ORDER BY updated_at LIMIT 10`;
  for (const p of payments) {
    if (Date.now() - started > 25000) break;
    try {
      const data = await flutterwave(
        "/transactions/verify_by_reference?tx_ref=" + encodeURIComponent(p.id),
      );
      if (data?.id) await verifyPayment(String(data.id));
    } catch {
      failures.push(p.id);
    }
    await sql`UPDATE payments SET updated_at=now() WHERE id=${p.id}`;
  }
  const transfers =
    await sql`SELECT * FROM transfers WHERE status IN ('PENDING','PROCESSING','SUBMITTING','REVIEW_REQUIRED') ORDER BY updated_at LIMIT 10`;
  for (const t of transfers) {
    if (Date.now() - started > 40000) break;
    try {
      if (t.status === "PENDING") {
        await processTransfer(t.id);
        continue;
      }
      let data;
      if (t.provider_id)
        data = await flutterwave(
          (t.kind === "REFUND" ? "/refunds/" : "/transfers/") +
            encodeURIComponent(t.provider_id),
        );
      else if (t.kind === "PAYOUT") {
        const found = await flutterwave(
          "/transfers?reference=" + encodeURIComponent(t.id),
        );
        data = Array.isArray(found)
          ? found.find((x) => x.reference === t.id)
          : null;
      }
      if (!data) {
        failures.push(t.id);
        continue;
      }
      if (
        t.kind === "PAYOUT" &&
        (data.reference !== t.id || data.currency !== "NGN")
      ) {
        failures.push(t.id);
        continue;
      }
      const status = String(data.status).toLowerCase();
      const successful = ["successful", "completed", "completed-mpgs"].includes(
        status,
      );
      await sql`UPDATE transfers SET status=${successful ? "SUCCEEDED" : status === "failed" ? "REVIEW_REQUIRED" : "PROCESSING"},provider_id=${String(data.id)},updated_at=now() WHERE id=${t.id}`;
      if (successful && t.kind === "REFUND")
        await sql`UPDATE orders SET stage='REFUNDED',updated_at=now() WHERE id=${t.order_id}`;
    } catch {
      failures.push(t.id);
    }
  }
  if (
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    Date.now() - started < 45000
  ) {
    const pending =
      await sql`SELECT id,user_id,href FROM notifications WHERE push_sent_at IS NULL ORDER BY created_at LIMIT 10`;
    for (const notification of pending) {
      if (Date.now() - started > 50000) break;
      try {
        const subscriptions = await listPushSubscriptions(notification.user_id);
        const result = await sendPushNotifications(
          subscriptions.map((s) => ({
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          })),
          {
            id: notification.id,
            url: notification.href,
            title: "KinSous",
            body: "Your order has an update.",
          },
        );
        await Promise.all(
          result.invalidEndpoints.map((endpoint) =>
            deletePushSubscription(notification.user_id, endpoint),
          ),
        );
        await sql`UPDATE notifications SET push_sent_at=now() WHERE id=${notification.id}`;
      } catch {
        failures.push(notification.id);
      }
    }
  }
  await sql`DELETE FROM rate_limits WHERE reset_at<now()-interval '1 day'`;
  await sql`DELETE FROM sessions WHERE expires_at<now()`;
  return NextResponse.json(
    { ok: !failures.length, reviewRequired: failures },
    { status: failures.length ? 207 : 200 },
  );
}
