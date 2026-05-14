"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import VideoShoppingOverlay from "@/components/video/VideoShoppingOverlay";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { dbUserToProfile } from "@/lib/mappers";
import type { Profile } from "@/types";

export default function VideoPage() {
  const [active, setActive] = useState(false);
  const [helper, setHelper] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useCurrentUser();

  useEffect(() => {
    fetch("/api/helpers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const helpers = (data?.helpers ?? []).map((u: any) => dbUserToProfile(u));
        setHelper(helpers[0] ?? null);
      })
      .catch(() => setHelper(null))
      .finally(() => setLoading(false));
  }, []);

  if (active && helper) {
    return (
      <VideoShoppingOverlay
        helperName={helper.name}
        helperAvatar={helper.avatarUrl}
        seekerName={user?.name ?? "You"}
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

      {!loading && !helper && (
        <div className="bg-card rounded-3xl shadow-card p-4 border border-card-border text-center mb-4">
          <p className="text-sm font-semibold text-charcoal">No helpers available</p>
          <p className="text-xs text-muted mt-1">Switch to helper role on another account to start live sessions.</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-card overflow-hidden mb-4"
      >
        <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <Video size={48} className="text-white/30" />
        </div>
        <div className="p-4 flex items-center gap-3">
          {helper ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={helper.avatarUrl} alt={helper.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary-100" />
              <div>
                <p className="font-bold text-charcoal">{helper.name}</p>
                <p className="text-sm text-muted">{helper.location.city} · {helper.location.country}</p>
                <p className="text-xs text-secondary-600 font-semibold mt-0.5">● Available now</p>
              </div>
            </>
          ) : (
            <div>
              <p className="font-bold text-charcoal">Waiting for helper</p>
              <p className="text-sm text-muted">No active helper profile found yet.</p>
            </div>
          )}
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
        disabled={!helper}
        className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-3xl font-bold text-lg shadow-primary"
      >
        <Video size={22} /> Start Live Session
      </motion.button>
    </div>
  );
}
