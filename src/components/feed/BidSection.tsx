"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Star, Send, Shield } from "lucide-react";
import type { Bounty } from "@/types";
import { formatCurrency, timeAgo } from "@/lib/mock-data";

interface BidSectionProps { bounty: Bounty }

export default function BidSection({ bounty }: BidSectionProps) {
  const [msg, setMsg] = useState("");
  const [amt, setAmt] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!msg.trim() || !amt) return;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setMsg(""); setAmt(""); }, 3000);
  };

  return (
    <div className="space-y-4">
      {bounty.bids && bounty.bids.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Bids ({bounty.bids.length})
          </h4>
          <div className="space-y-2">
            {bounty.bids.map((bid, i) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 bg-gray-50 rounded-2xl p-3"
              >
                <img
                  src={bid.helper.avatarUrl} alt={bid.helper.name}
                  className="w-9 h-9 rounded-full flex-shrink-0 object-cover ring-2 ring-primary-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-charcoal">{bid.helper.name}</span>
                      {bid.helper.chefScore && (
                        <span className="ml-2 text-xs text-primary font-medium">
                          ⭐ {bid.helper.chefScore}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-secondary-700 text-sm flex-shrink-0">
                      {formatCurrency(bid.amount, bid.currency)}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{bid.message}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />~{bid.estimatedDeliveryMinutes} min
                    </span>
                    <span>{timeAgo(bid.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {bounty.status === "OPEN" && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Place a Bid
          </h4>
          <div className="flex gap-2">
            <div className="relative flex-shrink-0 w-28">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">
                {bounty.currency === "USD" ? "$" : "₦"}
              </span>
              <input
                type="number" placeholder="Amount" value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="w-full pl-6 pr-2 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <input
              type="text" placeholder="Your pitch…" value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted bg-secondary-50 rounded-xl px-3 py-2">
            <Shield size={13} className="text-secondary-600 flex-shrink-0" />
            <span>Payment held in secure escrow until delivery is confirmed</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={!msg.trim() || !amt || submitted}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              submitted
                ? "bg-secondary-500 text-white"
                : "bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {submitted ? <><Star size={14} className="fill-white" /> Bid Submitted!</> : <><Send size={14} /> Submit Bid</>}
          </motion.button>
        </div>
      )}
    </div>
  );
}
