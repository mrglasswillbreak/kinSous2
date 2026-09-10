"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
export default function WorkSummary() {
  const { user } = useCurrentUser();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        setCount(
          d
            ? d.orders.filter(
                (o: { stage: string }) =>
                  !["COMPLETED", "REFUNDED", "CANCELLED"].includes(o.stage),
              ).length
            : null,
        ),
      )
      .catch(() => setCount(null));
  }, [user]);
  if (!user) return null;
  const helper = user.role === "HELPER";
  return (
    <section className="mx-4 mt-6 p-6 rounded-3xl bg-card border border-card-border shadow-sm">
      <p className="text-primary font-semibold text-sm">
        WELCOME BACK, {user.firstName || user.name.split(" ")[0]}
      </p>
      <h2 className="text-2xl font-bold mt-2">
        {helper ? "Good food starts with you." : "What are you craving today?"}
      </h2>
      <p className="text-muted mt-2">
        {count === null
          ? "Your orders and conversations, all in one place."
          : count
            ? count +
              " active " +
              (count === 1 ? "order needs" : "orders need") +
              " your attention."
            : helper
              ? "Find a request that matches your skills."
              : "Find a local helper to bring your food plans to life."}
      </p>
      <div className="flex flex-wrap gap-3 mt-5">
        <Link
          className="min-h-11 rounded-xl bg-primary px-5 py-3 text-white font-semibold"
          href="/bounties"
        >
          {helper ? "Find opportunities" : "Post or browse a bounty"}
        </Link>
        <Link
          className="min-h-11 rounded-xl bg-subtle border border-card-border px-5 py-3 font-semibold"
          href="/payment"
        >
          {helper ? "Assigned work" : "My orders"}
        </Link>
      </div>
    </section>
  );
}
