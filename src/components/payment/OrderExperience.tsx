"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePolling } from "@/hooks/usePolling";
import { usePwa } from "@/components/ui/PwaProvider";
import type { Order } from "@/lib/payments";
type Detail = {
  order: Order;
  events: { stage: string; note: string | null; created_at: string }[];
  payment: { status: string } | null;
  transfer: { kind: string; status: string } | null;
};
const stages = [
  "AWAITING_PAYMENT",
  "PAID",
  "SHOPPING",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
];
const labels: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  SHOPPING: "Shopping",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REFUNDED: "Refunded",
  DISPUTE: "Issue reported",
  CANCELLED: "Cancelled",
};
const money = (kobo: number | string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(kobo) / 100,
  );
export default function OrderExperience() {
  const params = useSearchParams();
  const id = params.get("bountyId");
  const { user } = useCurrentUser();
  const { online } = usePwa();
  const [orders, setOrders] = useState<Order[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        id ? "/api/orders/" + encodeURIComponent(id) : "/api/orders",
      );
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      if (id) setDetail(data);
      else setOrders(data.orders);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setLoading(true);
    setDetail(null);
    void refresh();
  }, [refresh]);
  usePolling(refresh, 15000);
  const act = async (action: string) => {
    if (!online || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        "/api/orders/" +
          encodeURIComponent(id!) +
          (action === "PAY" ? "/checkout" : "/action"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, note }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      if (data.url) {
        location.assign(data.url);
        return;
      }
      setReporting(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  };
  const order = detail?.order;
  const customer = order?.seeker_id === user?.userId;
  const next = order
    ? (
        {
          PAID: "SHOPPING",
          SHOPPING: "IN_TRANSIT",
          IN_TRANSIT: "DELIVERED",
        } as Record<string, string>
      )[order.stage]
    : null;
  return (
    <div className="max-w-3xl mx-auto px-5 py-7 space-y-6" aria-busy={busy}>
      <div>
        <p className="text-sm text-primary font-semibold">
          YOUR KINSOUS ORDERS
        </p>
        <h1 className="text-3xl font-bold text-charcoal mt-2">
          {order?.title || "Orders & payments"}
        </h1>
        <p className="text-muted mt-2">
          Every step, from an accepted bid to a meal at your door.
        </p>
      </div>
      {error && (
        <div role="alert" className="notice">
          {error}
          <button onClick={refresh}>Try again</button>
        </div>
      )}
      {loading && <p role="status">Loading your orders…</p>}
      {!id && !loading && (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={"/payment?bountyId=" + encodeURIComponent(o.id)}
              className="block rounded-2xl border border-card-border bg-card p-5 hover:shadow-md"
            >
              <div className="flex justify-between gap-4 font-semibold">
                <span>{o.title}</span>
                <span>{money(o.amount_kobo)}</span>
              </div>
              <p className="text-sm text-muted mt-2">
                {labels[o.stage] || o.stage}
              </p>
            </Link>
          ))}
          {!orders.length && (
            <div className="bg-card border border-card-border rounded-2xl p-6">
              <h2 className="font-semibold">
                Your next food story starts here
              </h2>
              <p className="text-muted my-3">
                Once a bidder with payout details is selected, the order appears
                here.
              </p>
              <Link className="text-primary font-semibold" href="/bounties">
                Explore bounties →
              </Link>
            </div>
          )}
        </div>
      )}
      {order && (
        <>
          <div className="bg-card rounded-3xl border border-card-border p-6">
            <p className="text-muted text-sm">Accepted price</p>
            <p className="text-4xl font-bold mt-2">
              {money(order.amount_kobo)}
            </p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Platform commission (10%)</dt>
                <dd>{money(order.commission_kobo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Helper receives</dt>
                <dd>{money(order.helper_kobo)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted mt-4">
              KinSous covers payment processing charges. Helper payout follows
              confirmed delivery.
            </p>
            <p className="font-semibold mt-4">
              Payment: {detail?.payment?.status || "Not started"}
            </p>
            {detail?.transfer && (
              <p className="text-sm mt-2">
                {detail.transfer.kind === "REFUND" ? "Refund" : "Helper payout"}
                : {detail.transfer.status.toLowerCase().replaceAll("_", " ")}
              </p>
            )}
          </div>
          <ol
            className="bg-card border border-card-border rounded-3xl p-6 space-y-5"
            aria-label="Delivery progress"
          >
            {stages.map((stage, index) => {
              const completed = index <= stages.indexOf(order.stage);
              const event = detail?.events.find((e) => e.stage === stage);
              return (
                <li key={stage} className="flex items-start gap-3">
                  <span
                    className={
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold " +
                      (completed
                        ? "bg-primary text-white"
                        : "bg-badge text-muted")
                    }
                  >
                    {completed ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{labels[stage]}</p>
                    {event && (
                      <time className="text-xs text-muted">
                        {new Date(event.created_at).toLocaleString()}
                      </time>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {order.dispute_status === "OPEN" ? (
            <div className="notice">
              This order is under review. Payment release is paused while our
              team resolves the issue.
            </div>
          ) : (
            <div className="space-y-3">
              {customer && order.stage === "AWAITING_PAYMENT" && (
                <button
                  disabled={!online || busy}
                  onClick={() => act("PAY")}
                  className="w-full min-h-12 bg-primary text-white rounded-2xl font-bold"
                >
                  {busy
                    ? "Preparing checkout…"
                    : "Pay " + money(order.amount_kobo)}
                </button>
              )}
              {!customer && next && (
                <button
                  disabled={!online || busy}
                  onClick={() => act(next)}
                  className="w-full min-h-12 bg-primary text-white rounded-2xl font-bold"
                >
                  {next === "SHOPPING"
                    ? "Start shopping"
                    : next === "IN_TRANSIT"
                      ? "Mark as on the way"
                      : "Mark as delivered"}
                </button>
              )}
              {customer && order.stage === "DELIVERED" && (
                <button
                  disabled={!online || busy}
                  onClick={() => act("COMPLETED")}
                  className="w-full min-h-12 bg-primary text-white rounded-2xl font-bold"
                >
                  Confirm delivery & release helper payout
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <Link
              className="text-primary font-semibold min-h-11"
              href={"/bounties/" + order.id}
            >
              View bounty
            </Link>
            <Link
              className="text-primary font-semibold min-h-11"
              href="/messages"
            >
              Open messages
            </Link>
            {!["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.stage) &&
              order.dispute_status === "NONE" && (
                <button
                  className="text-primary font-semibold"
                  onClick={() => setReporting(!reporting)}
                >
                  Report an issue
                </button>
              )}
          </div>
          {reporting && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void act("DISPUTE");
              }}
            >
              <label htmlFor="issue" className="block font-semibold">
                Tell us what happened
              </label>
              <textarea
                id="issue"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                minLength={10}
                maxLength={2000}
                required
                className="w-full rounded-2xl bg-card border border-card-border p-4"
              />
              <button
                disabled={!online || busy}
                className="bg-primary text-white rounded-xl px-5 min-h-11"
              >
                Send for review
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
