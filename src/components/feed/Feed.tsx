"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Plus, Flame } from "lucide-react";
import type { BountyCategory } from "@/types";
import { mockBounties, categoryLabels } from "@/lib/mock-data";
import BountyCard from "./BountyCard";
import PostBountyModal from "./PostBountyModal";

const categories: Array<BountyCategory | "ALL"> = [
  "ALL", "GROCERY", "COOKING", "CATERING", "INGREDIENT_SOURCING", "RECIPE_HELP",
];

const tabLabel: Record<string, string> = { ALL: "All", ...categoryLabels };

export default function Feed() {
  const [activeCategory, setActiveCategory] = useState<BountyCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [postModalOpen, setPostModalOpen] = useState(false);

  const filtered = mockBounties.filter((b) => {
    const matchesCat = activeCategory === "ALL" || b.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
              <Flame size={24} className="text-primary" /> Bounty Board
            </h1>
            <p className="text-muted text-sm mt-0.5">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} near you
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setPostModalOpen(true)}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-primary"
          >
            <Plus size={20} className="text-white" />
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
      </div>

      <motion.div layout className="space-y-4 mt-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16 text-muted"
            >
              <p className="text-4xl mb-3">🍽️</p>
              <p className="font-semibold text-charcoal">No bounties found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </motion.div>
          ) : (
            filtered.map((bounty) => (
              <motion.div
                key={bounty.id} layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                <BountyCard bounty={bounty} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <PostBountyModal open={postModalOpen} onClose={() => setPostModalOpen(false)} />
    </div>
  );
}
