"use client";
import { useEffect, useState } from "react";
export default function PayoutSettings() {
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/auth/payout")
      .then((r) => r.json())
      .then((d) => {
        setBanks(d.banks || []);
        if (d.configured)
          setMessage(d.accountName + " · Account ending " + d.last4);
      })
      .catch(() => setMessage("Unable to load payout settings."));
  }, []);
  return (
    <form
      className="bg-card border border-card-border rounded-2xl p-5 space-y-3 my-5"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/auth/payout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bank, account }),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setMessage("Verified: " + d.accountName);
          setAccount("");
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Unable to save");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-bold">Helper payouts</h2>
      <p className="text-sm text-muted">
        Verify your Nigerian bank account before accepting paid work. You
        receive 90% of the accepted bid.
      </p>
      <label className="block">
        Bank
        <select
          required
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="block w-full border border-card-border bg-card rounded-xl p-3"
        >
          <option value="">Choose your bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Account number
        <input
          required
          pattern="[0-9]{10}"
          inputMode="numeric"
          autoComplete="off"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="block w-full border border-card-border bg-card rounded-xl p-3"
        />
      </label>
      <button
        disabled={busy || !banks.length}
        className="min-h-11 px-4 rounded-xl bg-primary text-white"
      >
        Verify payout account
      </button>
      <p role="status" className="text-sm">
        {message ||
          (!banks.length
            ? "Payout setup will become available when payments are configured."
            : "")}
      </p>
    </form>
  );
}
