"use client";
import { useCallback, useEffect, useState } from "react";
type Row = {
  id: string;
  title?: string;
  stage?: string;
  status?: string;
  reason?: string;
  reported_user_id?: string;
  dispute_status?: string;
};
export default function AdminPanel() {
  const [data, setData] = useState<{
    orders: Row[];
    transfers: Row[];
    reports: Row[];
  }>({ orders: [], transfers: [], reports: [] });
  const [id, setId] = useState("");
  const [action, setAction] = useState("REFUND");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin");
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to load");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Operations</h1>
      <p className="text-muted">
        Resolve orders and review stalled money movements. All resolutions
        require a reason and are recorded.
      </p>
      {Object.entries(data).map(([label, rows]) => (
        <section key={label}>
          <h2 className="text-xl font-semibold capitalize mb-3">{label}</h2>
          {rows.length ? (
            rows.map((r) => (
              <div
                className="p-4 border border-card-border rounded-xl bg-card mb-2"
                key={r.id}
              >
                <p className="font-semibold">{r.title || r.id}</p>
                <p>
                  {r.stage || r.status || r.reason}{" "}
                  {r.dispute_status === "OPEN" ? "· Dispute open" : ""}
                </p>
                <button
                  className="min-h-11 text-primary"
                  onClick={() => setId(r.reported_user_id || r.id)}
                >
                  Select {r.reported_user_id ? "reported user" : "record"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-muted">Nothing to review.</p>
          )}
        </section>
      ))}
      <form
        className="bg-card rounded-2xl border border-card-border p-5 space-y-3"
        aria-busy={busy}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await fetch("/api/admin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, action, reason }),
            });
            const d = await r.json();
            if (!r.ok) throw Error(d.error);
            setMessage(
              "Resolution recorded. Queued money movements are processed by reconciliation.",
            );
            setReason("");
            await refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Unable to resolve");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          Order or user ID
          <input
            required
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="block w-full p-3 border border-card-border rounded-xl bg-card"
          />
        </label>
        <label className="block">
          Action
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="block w-full p-3 bg-card border border-card-border rounded-xl"
          >
            <option value="REFUND">Full refund</option>
            <option value="RELEASE">Release delivered order payout</option>
            <option value="CANCEL">
              Cancel unpaid order without payment attempt
            </option>
            <option value="SUSPEND">Suspend user</option>
          </select>
        </label>
        <label className="block">
          Reason
          <textarea
            required
            minLength={10}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full p-3 bg-card border border-card-border rounded-xl"
          />
        </label>
        <button
          disabled={busy}
          className="min-h-11 rounded-xl px-5 bg-primary text-white"
        >
          Record resolution
        </button>
        <p role="status">{message}</p>
      </form>
    </div>
  );
}
