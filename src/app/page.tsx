"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, MapPin, Shield, Video, ArrowRight, Star, ChevronRight } from "lucide-react";
import { mockBounties, mockHelpers, formatCurrency, timeAgo } from "@/lib/mock-data";

const features = [
  { icon: Flame, title: "Bounty Board", description: "Post food requests and get bids from local culinary helpers", href: "/bounties", color: "bg-primary-50 text-primary-500" },
  { icon: Video, title: "FaceTime Assist", description: "Live video shopping – approve ingredients in real-time", href: "/video", color: "bg-blue-50 text-blue-600" },
  { icon: Shield, title: "Secure Escrow", description: "Funds held safely until you confirm your order", href: "/payment", color: "bg-secondary-50 text-secondary-500" },
  { icon: MapPin, title: "Live Tracking", description: "Follow your helper's real-time location", href: "/tracker", color: "bg-purple-50 text-purple-600" },
];

export default function HomePage() {
  const recent = mockBounties.slice(0, 3);
  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Hero */}
      <div className="relative px-5 pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-secondary-50 -z-10" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-primary">
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal leading-tight">KinSous</h1>
              <p className="text-xs text-muted">FolkProvidr</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-charcoal leading-tight">
            Taste Your <span className="text-primary">Heritage,</span>
            <br />Wherever You Are
          </h2>
          <p className="text-muted mt-2 leading-relaxed">
            Connect with local culinary helpers for authentic West African food experiences — from Lagos to Atlanta.
          </p>

          <div className="flex gap-3 mt-5">
            <Link href="/bounties">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-primary"
              >
                Post a Bounty <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/profile">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-white text-charcoal px-5 py-2.5 rounded-2xl text-sm font-semibold border border-gray-200 shadow-card"
              >
                Become a Helper
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mx-4 bg-white rounded-3xl shadow-card p-4 flex items-center justify-around"
      >
        {[{ value: "2,400+", label: "Bounties Filled" }, { value: "340", label: "Active Helpers" }, { value: "4.9★", label: "Avg Rating" }].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-charcoal">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="px-4 mt-6">
        <h3 className="text-lg font-bold text-charcoal mb-3">How It Works</h3>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feat, i) => (
            <Link key={feat.title} href={feat.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }} whileTap={{ scale: 0.97 }}
                className="bg-white rounded-3xl shadow-card p-4 h-full"
              >
                <div className={`w-10 h-10 rounded-2xl ${feat.color} flex items-center justify-center mb-3`}>
                  <feat.icon size={20} />
                </div>
                <p className="font-bold text-charcoal text-sm">{feat.title}</p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{feat.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bounties */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-charcoal">Recent Bounties</h3>
          <Link href="/bounties" className="text-primary text-sm font-semibold flex items-center gap-1">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="space-y-3">
          {recent.map((b, i) => (
            <Link key={b.id} href={`/bounties/${b.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl shadow-card p-3 flex items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.seeker.avatarUrl} alt={b.seeker.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal truncate">{b.title}</p>
                  <p className="text-xs text-muted">{b.location.city} · {timeAgo(b.createdAt)}</p>
                </div>
                <span className="text-sm font-bold text-secondary-700 flex-shrink-0">
                  {formatCurrency(b.budget, b.currency)}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Helpers */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-charcoal">Top Helpers</h3>
          <Link href="/profile" className="text-primary text-sm font-semibold flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {mockHelpers.map((h, i) => (
            <Link key={h.id} href="/profile">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }} whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 bg-white rounded-3xl shadow-card p-4 w-44 text-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.avatarUrl} alt={h.name} className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-primary-100" />
                <p className="text-sm font-bold text-charcoal mt-2 truncate">{h.name}</p>
                <p className="text-xs text-muted">{h.location.city}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-charcoal">{h.helperStats?.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted">({h.helperStats?.completedOrders})</span>
                </div>
                {h.chefScore && (
                  <div className="mt-2 bg-primary-50 rounded-full px-2 py-0.5 inline-block">
                    <span className="text-xs font-bold text-primary">🔥 {h.chefScore}</span>
                  </div>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
