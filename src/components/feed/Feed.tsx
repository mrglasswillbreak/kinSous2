"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Plus, Flame } from "lucide-react";
import type { BountyCategory, Bounty } from "@/types";
import { categoryLabels } from "@/lib/mock-data";
import { dbBountyToAppBounty } from "@/lib/mappers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import BountyCard from "./BountyCard";
import PostBountyModal from "./PostBountyModal";

const categories: Array<BountyCategory | "ALL"> = [
  "ALL", "GROCERY", "COOKING", "CATERING", "INGREDIENT_SOURCING", "RECIPE_HELP",
];

const tabLabel: Record<string, string> = { ALL: "All", ...categoryLabels };
type BountyScope = "ALL" | "MY_BOUNTIES" | "MY_BIDS";
const scopeLabel: Record<BountyScope, string> = {
  ALL: "All",
  MY_BOUNTIES: "My bounties",
  MY_BIDS: "My bids",
};

function useLiveBounties(
  category: BountyCategory | "ALL",
  query: string,
  scope: BountyScope,
  userId?: string
) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBounties = useCallback(async (cat: string, q: string, nextScope: BountyScope, nextUserId?: string) => {
    if (nextScope !== "ALL" && !nextUserId) {
      setBounties([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cat && cat !== "ALL") params.set("category", cat);
      if (q) params.set("q", q);
      if (nextScope === "MY_BOUNTIES" && nextUserId) params.set("seekerId", nextUserId);
      if (nextScope === "MY_BIDS" && nextUserId) params.set("helperId", nextUserId);
      const res = await fetch(`/api/bounties?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBounties((data.bounties ?? []).map(dbBountyToAppBounty));
      }
    } catch (err) {
      console.error("Feed: failed to load bounties", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => fetchBounties(category, query, scope, userId),
      query ? 400 : 0
    );
    return () => clearTimeout(timer);
  }, [category, query, scope, userId, fetchBounties]);

  return { bounties, loading, refetch: () => fetchBounties(category, query, scope, userId) };
}

export default function Feed() {
  const { user } = useCurrentUser();
  const [activeCategory, setActiveCategory] = useState<BountyCategory | "ALL">("ALL");
  const [activeScope, setActiveScope] = useState<BountyScope>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [postModalOpen, setPostModalOpen] = useState(false);

  const { bounties, loading, refetch } = useLiveBounties(
    activeCategory,
    searchQuery,
    activeScope,
    user?.userId
  );

  const displayed = bounties;

  return (
    <div className="max-w-2xl mx-auto lg:max-w-5xl px-4 pb-24 lg:pb-10">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <Flame size={24} className="text-primary" /> Bounty Board
            </h1>
            <p className="text-muted text-sm mt-0.5">
              {loading ? "Loading…" : `${displayed.length} request${displayed.length !== 1 ? "s" : ""} near you`}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setPostModalOpen(true)}
            aria-label="Post Bounty"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-2xl text-sm font-semibold shadow-primary"
          >
            <Plus size={16} className="shrink-0" />
            <span className="hidden sm:inline">Post Bounty</span>
          </motion.button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text" placeholder="Search bounties…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-card border border-card-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm text-charcoal placeholder:text-muted"
          />
          <SlidersHorizontal size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => (
            <motion.button
              key={cat} whileTap={{ scale: 0.94 }}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-primary"
                  : "bg-card text-muted border border-card-border"
              }`}
            >
              {tabLabel[cat]}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {(Object.keys(scopeLabel) as BountyScope[]).map((scope) => (
            <motion.button
              key={scope}
              whileTap={{ scale: 0.94 }}
              onClick={() => setActiveScope(scope)}
              aria-pressed={activeScope === scope}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeScope === scope
                  ? "bg-charcoal text-white"
                  : "bg-card text-muted border border-card-border"
              }`}
            >
              {scopeLabel[scope]}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`skel-${i}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-card rounded-3xl h-32 animate-pulse border border-card-border"
              />
            ))
          ) : displayed.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="col-span-full text-center py-16 text-muted"
            >
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-semibold text-charcoal">No bounties found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </motion.div>
          ) : (
            displayed.map((bounty) => (
              <motion.div
                key={bounty.id} layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                <BountyCard bounty={bounty} onChanged={refetch} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <PostBountyModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onPosted={refetch}
      />
    </div>
  );
}
