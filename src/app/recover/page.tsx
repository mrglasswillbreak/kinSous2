"use client";
import { useState } from "react";
import Link from "next/link";
export default function Recover() {
  const [email, setEmail] = useState("");
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
          const r = await fetch("/api/auth/recover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const d = await r.json();
          setMessage(d.message || d.error);
        } catch {
          setMessage("Connection failed. Please retry.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-3xl font-bold">Find your way back</h1>
      <p className="text-muted">
        We’ll email you a link to reset your password.
      </p>
      <label className="block">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block mt-2 w-full p-3 bg-card border border-card-border rounded-xl"
        />
      </label>
      <button
        disabled={busy}
        className="w-full min-h-12 bg-primary text-white rounded-xl font-semibold"
      >
        Send reset link
      </button>
      <p role="status">{message}</p>
      <Link className="text-primary block" href="/login">
        Back to sign in
      </Link>
    </form>
  );
}
