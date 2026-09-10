import { randomUUID } from "crypto";
import { sql, usingLocalDb } from "./db";
import { matchesPayment } from "./payment-validation";
export function requirePayments() {
  if (
    usingLocalDb() ||
    !process.env.FLW_SECRET_KEY ||
    process.env.PAYMENTS_ENABLED !== "true"
  )
    throw new Error("Online payments are not configured yet");
  if (
    !process.env.FLW_SECRET_KEY.includes("TEST") &&
    process.env.FLW_DELAYED_PAYOUT_APPROVED !== "true"
  )
    throw new Error("Live payment activation is pending");
}
export async function flutterwave(path: string, body?: unknown) {
  requirePayments();
  const response = await fetch("https://api.flutterwave.com/v3" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json();
  if (!response.ok || payload.status !== "success")
    throw new Error(
      "Payment provider could not complete the request. Please check its status before retrying.",
    );
  return payload.data;
}
export interface Order {
  id: string;
  title: string;
  seeker_id: string;
  helper_id: string;
  amount_kobo: number | string;
  commission_kobo: number | string;
  helper_kobo: number | string;
  stage: string;
  dispute_status: string;
}
export async function orderForUser(
  id: string,
  userId: string,
): Promise<Order | null> {
  if (usingLocalDb()) return null;
  const rows =
    await sql`SELECT o.*,b.title FROM orders o JOIN bounties b ON b.id=o.id WHERE o.id=${id} AND (o.seeker_id=${userId} OR o.helper_id=${userId})`;
  return (rows[0] as Order) || null;
}
export async function checkout(order: Order, email: string, name: string) {
  requirePayments();
  if (order.stage !== "AWAITING_PAYMENT" || order.dispute_status !== "NONE")
    throw new Error("This order cannot be paid now");
  const id = "ks-" + randomUUID();
  const created =
    await sql`INSERT INTO payments(id,order_id) VALUES(${id},${order.id}) ON CONFLICT DO NOTHING RETURNING id`;
  if (!created.length) {
    const previous =
      await sql`SELECT checkout_url FROM payments WHERE order_id=${order.id} AND status IN ('PENDING','PAID')`;
    if (previous[0]?.checkout_url) return previous[0].checkout_url as string;
    throw new Error(
      "A payment is already being prepared. Refresh its status shortly.",
    );
  }
  // Leave uncertain attempts pending: never create a second charge on a timeout.
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) throw new Error("Site URL is not configured");
  const data = await flutterwave("/payments", {
    tx_ref: id,
    amount: Number(order.amount_kobo) / 100,
    currency: "NGN",
    redirect_url: `${site}/payment?bountyId=${encodeURIComponent(order.id)}`,
    customer: { email, name },
    customizations: { title: "KinSous", description: order.title },
    meta: { order_id: order.id },
  });
  const link = new URL(data.link);
  if (
    link.protocol !== "https:" ||
    !(
      link.hostname === "checkout.flutterwave.com" ||
      link.hostname.endsWith(".flutterwave.com")
    )
  )
    throw new Error("Invalid checkout destination");
  await sql`UPDATE payments SET checkout_url=${link.href},updated_at=now() WHERE id=${id}`;
  return link.href;
}
export async function verifyPayment(providerId: string) {
  if (!/^\d+$/.test(providerId)) throw new Error("Invalid provider reference");
  const data = await flutterwave(`/transactions/${providerId}/verify`);
  const rows =
    await sql`SELECT p.id,p.order_id,o.amount_kobo FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.id=${data.tx_ref}`;
  const payment = rows[0];
  if (!payment) throw new Error("Unknown payment reference");
  if (data.status !== "successful") return false;
  if (!matchesPayment(data, payment.id, Number(payment.amount_kobo)))
    throw new Error("Payment amount, reference or currency does not match");
  await sql.transaction([
    sql`UPDATE payments SET status='PAID',provider_id=${String(data.id)},updated_at=now() WHERE id=${payment.id} AND status='PENDING'`,
    sql`WITH changed AS (UPDATE orders SET stage='PAID',updated_at=now() WHERE id=${payment.order_id} AND stage='AWAITING_PAYMENT' RETURNING id) INSERT INTO order_events(order_id,stage) SELECT id,'PAID' FROM changed`,
  ]);
  return true;
}
export async function processTransfer(id: string) {
  requirePayments();
  const claimed =
    await sql`UPDATE transfers SET status='SUBMITTING',updated_at=now() WHERE id=${id} AND status='PENDING' RETURNING *`;
  if (!claimed[0]) return;
  const transfer = claimed[0];
  const rows =
    await sql`SELECT o.*,u.payout_bank,u.payout_account,p.provider_id FROM orders o JOIN users u ON u.id=o.helper_id JOIN payments p ON p.order_id=o.id AND p.status='PAID' WHERE o.id=${transfer.order_id}`;
  const order = rows[0];
  if (!order) throw new Error("Paid order not found");
  try {
    const result =
      transfer.kind === "REFUND"
        ? await flutterwave(`/transactions/${order.provider_id}/refund`, {
            amount: Number(order.amount_kobo) / 100,
          })
        : await flutterwave("/transfers", {
            account_bank: order.payout_bank,
            account_number: order.payout_account,
            amount: Number(order.helper_kobo) / 100,
            currency: "NGN",
            debit_currency: "NGN",
            reference: transfer.id,
            narration: "KinSous completed order",
          });
    await sql`UPDATE transfers SET status='PROCESSING',provider_id=${String(result.id)},updated_at=now() WHERE id=${id}`;
  } catch (error) {
    await sql`UPDATE transfers SET status='REVIEW_REQUIRED',updated_at=now() WHERE id=${id}`;
    throw error;
  }
}
