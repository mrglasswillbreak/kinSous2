"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Globe, Shield, ChevronRight, Moon, Sun, Smartphone, LogOut, CreditCard,
  Mail, Lock, Check, X, Loader2,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ToggleProps { enabled: boolean; onChange: (v: boolean) => void }

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <motion.button
      layout onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-primary" : "bg-badge"}`}
    >
      <motion.div
        layout
        className="absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-md border border-card-border"
        animate={{ x: enabled ? "calc(100% - 4px)" : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </motion.button>
  );
}

interface SectionItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SectionItem({ icon, label, sublabel, right, onClick, danger }: SectionItemProps) {
  return (
    <motion.button
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-subtle transition-colors text-left ${
        danger ? "text-red-600" : ""
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${danger ? "bg-red-50 dark:bg-red-900/20" : "bg-badge"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-red-600" : "text-charcoal"}`}>{label}</p>
        {sublabel && <p className="text-xs text-muted mt-0.5">{sublabel}</p>}
      </div>
      {right ?? (onClick && <ChevronRight size={16} className="text-muted flex-shrink-0" />)}
    </motion.button>
  );
}

export default function Settings() {
  const router = useRouter();
  const { user, refetch: refetchUser } = useCurrentUser();
  const [notifications, setNotifications] = useState({
    newBid: true, bidAccepted: true, deliveryUpdate: true,
    messages: true, promotions: false,
  });
  const { darkMode, setDarkMode } = useTheme();

  // Sync role from DB user once loaded so Settings reflects real DB state
  useEffect(() => {
    if (user?.role === "SEEKER" || user?.role === "HELPER") {
      setRoleState(user.role);
      localStorage.setItem("kinsous-role", user.role);
    }
  }, [user?.role]);

  const [role, setRoleState] = useState<"SEEKER" | "HELPER">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kinsous-role") as "SEEKER" | "HELPER") ?? "SEEKER";
    }
    return "SEEKER";
  });

  const [currency, setCurrencyState] = useState<"NGN" | "USD">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("kinsous-currency") as "NGN" | "USD") ?? "NGN";
    }
    return "NGN";
  });

  // ── Change Email state ──────────────────────────────────────────────────────
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Change Password state ───────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const setRole = async (r: "SEEKER" | "HELPER") => {
    try {
      const res = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r }),
      });
      if (res.ok) {
        setRoleState(r);
        localStorage.setItem("kinsous-role", r);
        await refetchUser();
      }
    } catch (err) {
      console.error("Failed to persist role change:", err);
    }
  };

  const setCurrency = (c: "NGN" | "USD") => {
    setCurrencyState(c);
    localStorage.setItem("kinsous-currency", c);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess(false);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: emailPassword, newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Something went wrong");
      } else {
        setEmailSuccess(true);
        setNewEmail("");
        setEmailPassword("");
        await refetchUser();
        setTimeout(() => { setShowEmailForm(false); setEmailSuccess(false); }, 1500);
      }
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Something went wrong");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(false); }, 1500);
      }
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayName = user?.name ?? "Loading…";
  const displayEmail = user?.email ?? "";
  const displayCity = user?.city;
  const displayCountry = user?.country;
  const locationLabel = displayCity && displayCountry
    ? `${displayCity}, ${displayCountry}`
    : displayCity || displayCountry || null;
  const avatarUrl = user?.avatarUrl
    || `https://i.pravatar.cc/150?u=${encodeURIComponent(user?.userId ?? "default")}`;

  const sectionCard = "bg-card rounded-3xl shadow-card border border-card-border overflow-hidden";
  const sectionHeader = "px-4 py-3 border-b border-card-border";
  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-input-surface border border-card-border text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition";

  return (
    <div className="max-w-md mx-auto px-4 pb-24 pt-6 space-y-5">
      <h1 className="text-2xl font-bold text-charcoal px-0">Settings</h1>

      {/* Profile */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Account</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary-100" />
          <div className="min-w-0">
            <p className="font-bold text-charcoal truncate">{displayName}</p>
            <p className="text-xs text-muted truncate">
              {displayEmail}{locationLabel ? ` · ${locationLabel}` : ""}
            </p>
          </div>
        </div>
        <div className="border-t border-card-border">
          <SectionItem icon={<User size={16} className="text-muted" />} label="Edit Profile" sublabel="Name, bio, avatar" onClick={() => router.push("/profile")} />
        </div>
      </div>

      {/* Change Email */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Email Address</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 bg-badge rounded-xl flex items-center justify-center">
            <Mail size={15} className="text-muted" />
          </div>
          <p className="flex-1 text-sm text-charcoal truncate">{displayEmail || "—"}</p>
          <button
            onClick={() => { setShowEmailForm((v) => !v); setEmailError(""); setEmailSuccess(false); }}
            className="text-xs text-primary font-semibold flex-shrink-0"
          >
            {showEmailForm ? "Cancel" : "Change"}
          </button>
        </div>
        <AnimatePresence>
          {showEmailForm && (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleChangeEmail}
              className="overflow-hidden border-t border-card-border px-4 pb-4 pt-3 space-y-2.5"
            >
              <input
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="password"
                placeholder="Confirm with your password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className={inputCls}
              />
              {emailError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                  {emailError}
                </p>
              )}
              {emailSuccess && (
                <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Check size={13} /> Email updated successfully
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={emailLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm shadow-primary disabled:opacity-60 transition"
              >
                {emailLoading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} /> Update Email</>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Change Password */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Password</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 bg-badge rounded-xl flex items-center justify-center">
            <Lock size={15} className="text-muted" />
          </div>
          <p className="flex-1 text-sm text-charcoal">••••••••</p>
          <button
            onClick={() => { setShowPasswordForm((v) => !v); setPasswordError(""); setPasswordSuccess(false); }}
            className="text-xs text-primary font-semibold flex-shrink-0"
          >
            {showPasswordForm ? "Cancel" : "Change"}
          </button>
        </div>
        <AnimatePresence>
          {showPasswordForm && (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleChangePassword}
              className="overflow-hidden border-t border-card-border px-4 pb-4 pt-3 space-y-2.5"
            >
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={inputCls}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputCls}
              />
              {passwordError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <X size={13} /> {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Check size={13} /> Password updated successfully
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={passwordLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm shadow-primary disabled:opacity-60 transition"
              >
                {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} /> Update Password</>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Role */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Role</p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {(["SEEKER", "HELPER"] as const).map((r) => (
            <motion.button
              key={r} whileTap={{ scale: 0.96 }}
              onClick={() => setRole(r)}
              className={`py-3 rounded-2xl text-sm font-semibold transition-colors ${
                role === r ? "bg-primary text-white shadow-primary" : "bg-badge text-muted"
              }`}
            >
              {r === "SEEKER" ? "🛍️ Seeker" : "👨‍🍳 Helper"}
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted px-4 pb-4 leading-relaxed">
          {role === "SEEKER"
            ? "As a Seeker you post bounties and receive bids from local Helpers."
            : "As a Helper you bid on bounties and earn by completing culinary tasks."}
        </p>
      </div>

      {/* Payments */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Payments</p>
        </div>
        <div className="p-3 flex gap-2">
          {(["NGN", "USD"] as const).map((c) => (
            <motion.button
              key={c} whileTap={{ scale: 0.95 }}
              onClick={() => setCurrency(c)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currency === c ? "bg-secondary text-white" : "bg-badge text-muted"
              }`}
            >
              {c === "NGN" ? "₦ Naira" : "$ USD"}
            </motion.button>
          ))}
        </div>
        <div className="border-t border-card-border">
          <SectionItem
            icon={<CreditCard size={16} className="text-muted" />}
            label="Payment Methods"
            sublabel={currency === "NGN" ? "Flutterwave · NGN" : "Stripe · USD"}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Notifications</p>
        </div>
        {[
          { key: "newBid" as const, label: "New bids on my bounties", icon: <Bell size={15} className="text-primary" /> },
          { key: "bidAccepted" as const, label: "My bid was accepted", icon: <Bell size={15} className="text-secondary-600" /> },
          { key: "deliveryUpdate" as const, label: "Delivery updates", icon: <Smartphone size={15} className="text-blue-500" /> },
          { key: "messages" as const, label: "New messages", icon: <Bell size={15} className="text-purple-500" /> },
          { key: "promotions" as const, label: "Tips & promotions", icon: <Globe size={15} className="text-muted" /> },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-3 px-4 py-3 border-b border-card-border last:border-0">
            <div className="w-8 h-8 bg-badge rounded-xl flex items-center justify-center">{item.icon}</div>
            <p className="flex-1 text-sm text-charcoal">{item.label}</p>
            <Toggle
              enabled={notifications[item.key]}
              onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Appearance */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Appearance</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 bg-badge rounded-xl flex items-center justify-center">
            {darkMode ? <Moon size={15} className="text-muted" /> : <Sun size={15} className="text-yellow-500" />}
          </div>
          <p className="flex-1 text-sm text-charcoal">Dark Mode</p>
          <Toggle enabled={darkMode} onChange={setDarkMode} />
        </div>
      </div>

      {/* Security */}
      <div className={sectionCard}>
        <div className={sectionHeader}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Security & Privacy</p>
        </div>
        <SectionItem icon={<Shield size={16} className="text-muted" />} label="Privacy Settings" onClick={() => {}} />
        <SectionItem icon={<LogOut size={16} className="text-red-500" />} label="Sign Out" danger onClick={handleLogout} />
      </div>

      <p className="text-center text-xs text-muted pb-4">KinSous v0.1.0 · FolkProvidr</p>
    </div>
  );
}
