"use client";

import { motion } from "framer-motion";
import { Award, Calendar } from "lucide-react";
import type { CertificationBadge as CertBadgeType } from "@/types";

interface CertificationBadgeProps {
  badge: CertBadgeType;
  index?: number;
}

export default function CertificationBadge({ badge, index = 0 }: CertificationBadgeProps) {
  const isExpired = badge.expiresAt ? new Date(badge.expiresAt) < new Date() : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 280 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`relative bg-card rounded-2xl p-3 shadow-card border ${
        isExpired ? "border-card-border opacity-60" : "border-secondary-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isExpired ? "bg-badge" : "bg-secondary-50"
        }`}>
          <Award size={18} className={isExpired ? "text-muted" : "text-secondary-600"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-charcoal leading-tight">{badge.name}</p>
          <p className="text-xs text-muted truncate">{badge.issuer}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Calendar size={10} />
        <span>{new Date(badge.issuedAt).getFullYear()}</span>
        {badge.expiresAt && (
          <>
            <span>–</span>
            <span className={isExpired ? "text-red-500" : ""}>
              {new Date(badge.expiresAt).getFullYear()}
            </span>
          </>
        )}
      </div>

      {!isExpired && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-secondary-500 rounded-full flex items-center justify-center border-2 border-card">
          <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white">
            <path d="M10 3L5 8.5 2 5.5l-.7.7 3.7 3.7 5.7-6-.7-.9z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
