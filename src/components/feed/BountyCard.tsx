"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ChevronDown, DollarSign, Users, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Bounty } from "@/types";
import { timeAgo, formatCurrency, categoryLabels, categoryColors } from "@/lib/mock-data";
import BidSection from "./BidSection";

interface BountyCardProps { bounty: Bounty }

const statusColors: Record<string, string> = {
  OPEN: "bg-secondary-50 text-secondary-700 border border-secondary-200",
  IN_PROGRESS: "bg-primary-50 text-primary-700 border border-primary-200",
  AWAITING_APPROVAL: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  COMPLETED: "bg-gray-100 text-gray-600 border border-gray-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
};

export default function BountyCard({ bounty }: BountyCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      layout
      onClick={() => setExpanded(!expanded)}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-shadow cursor-pointer overflow-hidden border border-gray-100"
    >
      {bounty.imageUrls && bounty.imageUrls.length > 0 && (
        <div className="relative h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bounty.imageUrls[0]} alt={bounty.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bounty.seeker.avatarUrl} alt={bounty.seeker.name}
            className="w-10 h-10 rounded-full ring-2 ring-primary-100 flex-shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-charcoal text-sm">{bounty.seeker.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[bounty.category]}`}>
                {categoryLabels[bounty.category]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-muted text-xs">
              <span className="flex items-center gap-1"><MapPin size={11} />{bounty.location.city}, {bounty.location.country}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(bounty.createdAt)}</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
            className="text-muted flex-shrink-0 mt-1"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>

        <h3 className="font-bold text-charcoal text-base leading-snug">{bounty.title}</h3>
        <p className="text-muted text-sm leading-relaxed line-clamp-2">{bounty.description}</p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-secondary-50 flex items-center justify-center">
              <DollarSign size={14} className="text-secondary-600" />
            </div>
            <span className="font-bold text-secondary-700 text-base">
              {formatCurrency(bounty.budget, bounty.currency)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            {bounty.bids && bounty.bids.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={12} />{bounty.bids.length} bid{bounty.bids.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[bounty.status]}`}>
              {bounty.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <p className="text-sm text-charcoal leading-relaxed">{bounty.description}</p>

              {bounty.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bounty.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      <Tag size={10} />{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 bg-gray-50 rounded-2xl p-3">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal">{bounty.location.address}</p>
                  <p className="text-xs text-muted">{bounty.location.city}, {bounty.location.country}</p>
                </div>
              </div>

              <BidSection bounty={bounty} />

              <Link href={`/bounties/${bounty.id}`} onClick={(e) => e.stopPropagation()}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-primary border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  View full details <ArrowRight size={14} />
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
