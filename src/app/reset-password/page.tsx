"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
function Form() {
  const params = useSearchParams();
  const reset = params.get("kind") === "RESET";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="max-w-md mx-auto p-7 pt-16 space-y-5"
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: params.get("token"), password }),
          });
          const d = await r.json();
          setMessage(d.message || d.error);
          setPassword("");
        } catch {
          setMessage("Connection failed. Please retry.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-3xl font-bold">
        {reset ? "Choose a new password" : "Verify your email"}
      </h1>
      {reset && (
        <label className="block">
          New password
          <input
            type="password"
            minLength={10}
            maxLength={72}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block mt-2 w-full p-3 bg-card border border-card-border rounded-xl"
          />
        </label>
      )}
      <button
        disabled={busy}
        className="w-full min-h-12 bg-primary text-white rounded-xl font-semibold"
      >
        {reset ? "Update password" : "Verify email"}
      </button>
      <p role="status">{message}</p>
      <Link className="text-primary block" href="/login">
        Sign in
      </Link>
    </form>
  );
}
export default function Reset() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Form />
    </Suspense>
  );
}
