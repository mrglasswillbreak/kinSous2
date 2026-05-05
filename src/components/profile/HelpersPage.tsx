"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, MapPin, Package, Flame } from "lucide-react";
import type { Profile } from "@/types";
import { useHelpers } from "@/hooks/useData";
import { SkeletonHelperCard } from "@/components/ui/Skeleton";
import ChefScore from "@/components/profile/ChefScore";
import Link from "next/link";

function HelperCard({ helper, index }: { helper: Profile; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href="/profile">
        <div className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-primary-400 to-primary-600" />
          <div className="px-4 pb-4">
            <div className="flex items-end gap-3 -mt-8 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={helper.avatarUrl} alt={helper.name}
                className="w-16 h-16 rounded-2xl ring-4 ring-white object-cover shadow-md"
              />
              {helper.chefScore !== undefined && (
                <div className="mb-1">
                  <ChefScore score={helper.chefScore} size="sm" showLabel={false} />
                </div>
              )}
              <div className="ml-auto mb-1">
                <span className="text-xs bg-secondary-50 text-secondary-700 border border-secondary-200 px-2.5 py-1 rounded-full font-semibold">
                  ✓ Verified
                </span>
              </div>
            </div>

            <h3 className="font-bold text-charcoal">{helper.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
              <MapPin size={11} /> {helper.location.city}, {helper.location.country}
            </p>
            {helper.bio && (
              <p className="text-xs text-charcoal mt-2 leading-relaxed line-clamp-2 opacity-80">
                {helper.bio}
              </p>
            )}

            {helper.helperStats && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-charcoal">{helper.helperStats.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Package size={12} />
                  <span className="font-semibold text-charcoal">{helper.helperStats.completedOrders}</span>
                  <span>orders</span>
                </div>
                {helper.chefScore && (
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold ml-auto">
                    <Flame size={12} />
                    {helper.chefScore}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HelpersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [country, setCountry] = useState("");

  // Simple debounce via state
  const handleSearch = (val: string) => {
    setQuery(val);
    setTimeout(() => setDebouncedQuery(val), 300);
  };

  const { data: helpers, isLoading } = useHelpers({
    query: debouncedQuery || undefined,
    country: country || undefined,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-3 space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Browse Helpers</h1>
          <p className="text-sm text-muted mt-0.5">
            {isLoading ? "Loading…" : `${helpers.length} helper${helpers.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text" placeholder="Search by name, city, or specialty…"
            value={query} onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          {[{ value: "", label: "All Countries" }, { value: "Nigeria", label: "🇳🇬 Nigeria" }, { value: "United States", label: "🇺🇸 USA" }].map((opt) => (
            <motion.button
              key={opt.value} whileTap={{ scale: 0.93 }}
              onClick={() => setCountry(opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                country === opt.value ? "bg-primary text-white shadow-primary" : "bg-white text-muted border border-gray-200"
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl shadow-card p-4 space-y-3">
              <SkeletonHelperCard />
            </div>
          ))
        ) : helpers.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-3">👨‍🍳</p>
            <p className="font-semibold text-charcoal">No helpers found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          helpers.map((h, i) => <HelperCard key={h.id} helper={h} index={i} />)
        )}
      </div>
    </div>
  );
}
