"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemo = () => {
    setTab("login");
    setEmail("chioma@kinsous.com");
    setPassword("KinSous2024!");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = tab === "login" ? { email, password } : { email, name, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-background dark:to-gray-900 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center shadow-primary mx-auto mb-4">
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal">KinSous</h1>
          <p className="text-muted text-sm mt-1">Your Cultural Culinary Marketplace</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-card border border-card-border overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-card-border">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "text-primary border-b-2 border-primary bg-primary-50 dark:bg-primary-900/20"
                    : "text-muted"
                }`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name field (register only) */}
            <AnimatePresence mode="wait">
              {tab === "register" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={tab === "register"}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-input-surface border border-card-border text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-input-surface border border-card-border text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-input-surface border border-card-border text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-2xl font-semibold text-sm shadow-primary disabled:opacity-60 transition"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {tab === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 bg-card/80 backdrop-blur border border-card-border rounded-2xl p-4"
        >
          <p className="text-xs text-muted text-center mb-2 font-medium">
            🔑 Demo Account
          </p>
          <div className="text-xs text-charcoal space-y-1 text-center">
            <p><span className="text-muted">Email:</span> chioma@kinsous.com</p>
            <p><span className="text-muted">Password:</span> KinSous2024!</p>
          </div>
          <button
            onClick={fillDemo}
            className="mt-3 w-full text-xs text-primary font-semibold py-1.5 rounded-xl border border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition"
          >
            Use demo credentials
          </button>
        </motion.div>

        <p className="text-center text-xs text-muted mt-6">
          KinSous · FolkProvidr · v0.1.0
        </p>
      </motion.div>
    </div>
  );
}
