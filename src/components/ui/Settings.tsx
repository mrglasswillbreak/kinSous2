"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Globe, Shield, ChevronRight, Moon, Sun, Smartphone, LogOut, CreditCard,
} from "lucide-react";

interface ToggleProps { enabled: boolean; onChange: (v: boolean) => void }

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <motion.button
      layout onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-primary" : "bg-gray-200"}`}
    >
      <motion.div
        layout
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
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
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
        danger ? "text-red-600" : ""
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-gray-100"}`}>
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
  const [notifications, setNotifications] = useState({
    newBid: true, bidAccepted: true, deliveryUpdate: true,
    messages: true, promotions: false,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [role, setRole] = useState<"SEEKER" | "HELPER">("SEEKER");
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");

  return (
    <div className="max-w-md mx-auto px-4 pb-24 pt-6 space-y-5">
      <h1 className="text-2xl font-bold text-charcoal px-0">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Account</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://i.pravatar.cc/150?img=23" alt="You" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary-100" />
          <div>
            <p className="font-bold text-charcoal">Chioma Nwosu</p>
            <p className="text-xs text-muted">chioma@example.com · Abuja, NG</p>
          </div>
          <ChevronRight size={16} className="text-muted ml-auto" />
        </div>
        <div className="border-t border-gray-100">
          <SectionItem icon={<User size={16} className="text-gray-500" />} label="Edit Profile" sublabel="Name, bio, avatar" onClick={() => {}} />
        </div>
      </div>

      {/* Role */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Role</p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {(["SEEKER", "HELPER"] as const).map((r) => (
            <motion.button
              key={r} whileTap={{ scale: 0.96 }}
              onClick={() => setRole(r)}
              className={`py-3 rounded-2xl text-sm font-semibold transition-colors ${
                role === r ? "bg-primary text-white shadow-primary" : "bg-gray-100 text-muted"
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
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Payments</p>
        </div>
        <div className="p-3 flex gap-2">
          {(["NGN", "USD"] as const).map((c) => (
            <motion.button
              key={c} whileTap={{ scale: 0.95 }}
              onClick={() => setCurrency(c)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                currency === c ? "bg-secondary text-white" : "bg-gray-100 text-muted"
              }`}
            >
              {c === "NGN" ? "₦ Naira" : "$ USD"}
            </motion.button>
          ))}
        </div>
        <div className="border-t border-gray-100">
          <SectionItem
            icon={<CreditCard size={16} className="text-gray-500" />}
            label="Payment Methods"
            sublabel={currency === "NGN" ? "Flutterwave · NGN" : "Stripe · USD"}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Notifications</p>
        </div>
        {[
          { key: "newBid" as const, label: "New bids on my bounties", icon: <Bell size={15} className="text-primary" /> },
          { key: "bidAccepted" as const, label: "My bid was accepted", icon: <Bell size={15} className="text-secondary-600" /> },
          { key: "deliveryUpdate" as const, label: "Delivery updates", icon: <Smartphone size={15} className="text-blue-500" /> },
          { key: "messages" as const, label: "New messages", icon: <Bell size={15} className="text-purple-500" /> },
          { key: "promotions" as const, label: "Tips & promotions", icon: <Globe size={15} className="text-gray-400" /> },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">{item.icon}</div>
            <p className="flex-1 text-sm text-charcoal">{item.label}</p>
            <Toggle
              enabled={notifications[item.key]}
              onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Appearance</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
            {darkMode ? <Moon size={15} className="text-gray-500" /> : <Sun size={15} className="text-yellow-500" />}
          </div>
          <p className="flex-1 text-sm text-charcoal">Dark Mode</p>
          <Toggle enabled={darkMode} onChange={setDarkMode} />
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Security & Privacy</p>
        </div>
        <SectionItem icon={<Shield size={16} className="text-gray-500" />} label="Privacy Settings" onClick={() => {}} />
        <SectionItem icon={<LogOut size={16} className="text-red-500" />} label="Sign Out" danger onClick={() => {}} />
      </div>

      <p className="text-center text-xs text-muted pb-4">KinSous v0.1.0 · FolkProvidr</p>
    </div>
  );
}
