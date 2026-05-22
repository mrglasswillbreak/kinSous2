"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Video } from "lucide-react";
import { useSearchParams } from "next/navigation";
import VideoShoppingOverlay from "@/components/video/VideoShoppingOverlay";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { dbUserToProfile } from "@/lib/mappers";
import type { Profile } from "@/types";

function VideoPageContent() {
  const [active, setActive] = useState(false);
  const [helper, setHelper] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const helperId = searchParams.get("helperId");
  const bountyId = searchParams.get("bountyId");
  const mode = searchParams.get("mode") === "audio" ? "audio" : "video";

  useEffect(() => {
    setLoading(true);
    setError(null);
    const authorize = helperId && bountyId
      ? fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ helperId, bountyId }),
        }).then((r) => {
          if (!r.ok) throw new Error("Live calls are available only for the poster and selected bidder.");
        })
      : Promise.resolve();

    authorize
      .then(() => fetch("/api/helpers"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const helpers = (data?.helpers ?? []).map((u: any) => dbUserToProfile(u));
        setHelper(helperId ? helpers.find((h: Profile) => h.id === helperId) ?? null : null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to start live session.");
        setHelper(null);
      })
      .finally(() => setLoading(false));
  }, [helperId, bountyId]);

  if (active && helper) {
    return (
      <VideoShoppingOverlay
        helperName={helper.name}
        helperAvatar={helper.avatarUrl}
        seekerName={user?.name ?? "You"}
        mode={mode}
        onClose={() => setActive(false)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-charcoal mb-2">Live Assist</h1>
      <p className="text-muted text-sm mb-6">
        Start a secure session with the selected bidder for this bounty.
      </p>

      {!loading && (!helper || error) && (
        <div className="bg-card rounded-3xl shadow-card p-4 border border-card-border text-center mb-4">
          <p className="text-sm font-semibold text-charcoal">No active live session</p>
          <p className="text-xs text-muted mt-1">
            {error ?? "Accept a bid first, then open video or audio from the bounty."}
          </p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-card overflow-hidden mb-4"
      >
        <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          {mode === "audio" ? (
            <Headphones size={48} className="text-white/30" />
          ) : (
            <Video size={48} className="text-white/30" />
          )}
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

      <motion.button
        whileTap={{ scale: 0.96 }} onClick={() => setActive(true)}
        disabled={!helper}
        className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-3xl font-bold text-lg shadow-primary"
      >
        {mode === "audio" ? <Headphones size={22} /> : <Video size={22} />}
        Start {mode === "audio" ? "Audio" : "Video"} Session
      </motion.button>
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 pt-6 pb-24">
          <div className="h-8 w-32 bg-badge rounded-xl animate-pulse mb-4" />
          <div className="h-64 bg-card rounded-3xl border border-card-border animate-pulse" />
        </div>
      }
    >
      <VideoPageContent />
    </Suspense>
  );
}
