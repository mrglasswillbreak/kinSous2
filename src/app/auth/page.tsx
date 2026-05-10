"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@kinsous.app");
  const [password, setPassword] = useState("Demo@1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Authentication failed");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return <div className="min-h-screen flex items-center justify-center px-4 bg-background"><form onSubmit={submit} className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-6 space-y-4">
    <h1 className="text-2xl font-bold">Welcome to KinSous</h1>
    <p className="text-sm text-muted">Default account: demo@kinsous.app / Demo@1234</p>
    <div className="flex gap-2">
      <button type="button" className={`px-3 py-2 rounded-lg ${mode === "login" ? "bg-primary text-white" : "bg-gray-100 dark:bg-neutral-800"}`} onClick={() => setMode("login")}>Login</button>
      <button type="button" className={`px-3 py-2 rounded-lg ${mode === "register" ? "bg-primary text-white" : "bg-gray-100 dark:bg-neutral-800"}`} onClick={() => setMode("register")}>Register</button>
    </div>
    {mode === "register" && <input className="w-full border rounded-lg px-3 py-2 bg-transparent" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
    <input className="w-full border rounded-lg px-3 py-2 bg-transparent" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
    <input className="w-full border rounded-lg px-3 py-2 bg-transparent" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button disabled={loading} className="w-full bg-primary text-white rounded-lg py-2 font-medium">{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
  </form></div>;
}
