"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import VideoShoppingOverlay from "@/components/video/VideoShoppingOverlay";
import { mockHelpers, mockSeekers } from "@/lib/mock-data";

export default function VideoPage() {
  const [active, setActive] = useState(false);
  const helper = mockHelpers[0];
  const seeker = mockSeekers[0];

  if (active) {
    return (
      <VideoShoppingOverlay
        helperName={helper.name}
        helperAvatar={helper.avatarUrl}
        seekerName={seeker.name}
        onClose={() => setActive(false)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-charcoal mb-2">Live Assist</h1>
      <p className="text-muted text-sm mb-6">
        Start a FaceTime-style session with a Helper who shops for you in real-time.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-card overflow-hidden mb-4"
      >
        <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <Video size={48} className="text-white/30" />
        </div>
        <div className="p-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={helper.avatarUrl} alt={helper.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary-100" />
          <div>
            <p className="font-bold text-charcoal">{helper.name}</p>
            <p className="text-sm text-muted">{helper.location.city} · 🔥 {helper.chefScore}</p>
            <p className="text-xs text-secondary-600 font-semibold mt-0.5">● Available now</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3 mb-6">
        {[
          "📸 Helper sends live snapshots of ingredients for your approval",
          "💬 Chat in real-time while they shop",
          "✅ Confirm purchase before they check out",
          "🔒 Funds held in escrow until you're satisfied",
        ].map((f) => (
          <div key={f} className="flex items-start gap-3 text-sm text-charcoal">
            <span className="text-lg leading-tight">{f.slice(0, 2)}</span>
            <span className="leading-relaxed">{f.slice(2)}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }} onClick={() => setActive(true)}
        className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-3xl font-bold text-lg shadow-primary"
      >
        <Video size={22} /> Start Live Session
      </motion.button>
    </div>
  );
}
