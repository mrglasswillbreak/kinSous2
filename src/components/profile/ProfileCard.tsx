"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Package, DollarSign, ShieldCheck, Edit3 } from "lucide-react";
import type { Profile } from "@/types";
import { formatCurrency } from "@/lib/mock-data";
import ChefScore from "./ChefScore";
import CertificationBadge from "./CertificationBadge";

interface ProfileCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
}

export default function ProfileCard({ profile, isCurrentUser = false }: ProfileCardProps) {
  const isHelper = profile.role === "HELPER";

  return (
    <div className="max-w-md mx-auto space-y-4 px-4 py-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-card overflow-hidden"
      >
        <div className="h-24 bg-gradient-to-br from-primary-400 to-primary-600 relative">
          {isHelper && (
            <div className="absolute bottom-2 right-4 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold border border-white/30">
              ✦ Verified Helper
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={profile.avatarUrl} alt={profile.name}
              className="w-20 h-20 rounded-2xl ring-4 ring-white object-cover shadow-md"
            />
            {isHelper && profile.chefScore !== undefined && (
              <div className="mb-1">
                <ChefScore score={profile.chefScore} size="sm" showLabel={false} />
              </div>
            )}
            {isCurrentUser && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="ml-auto mb-1 flex items-center gap-1.5 text-xs text-muted border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={12} /> Edit
              </motion.button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-charcoal">{profile.name}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                isHelper ? "bg-primary-50 text-primary-700" : "bg-secondary-50 text-secondary-700"
              }`}>
                {profile.role}
              </span>
            </div>
            <p className="flex items-center gap-1 text-sm text-muted mt-1">
              <MapPin size={13} />
              {profile.location.city}, {profile.location.country}
            </p>
            {profile.bio && (
              <p className="text-sm text-charcoal mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {isHelper && profile.helperStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-card p-5"
        >
          <h3 className="font-bold text-charcoal mb-3">Performance</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-secondary-50 rounded-2xl p-3">
              <Package size={18} className="text-secondary-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-charcoal">{profile.helperStats.completedOrders}</p>
              <p className="text-xs text-muted">Orders</p>
            </div>
            <div className="text-center bg-yellow-50 rounded-2xl p-3">
              <Star size={18} className="text-yellow-500 mx-auto mb-1 fill-yellow-500" />
              <p className="text-xl font-bold text-charcoal">{profile.helperStats.averageRating.toFixed(1)}</p>
              <p className="text-xs text-muted">Rating</p>
            </div>
            <div className="text-center bg-primary-50 rounded-2xl p-3">
              <DollarSign size={18} className="text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-charcoal">
                {formatCurrency(profile.helperStats.totalEarnings, profile.helperStats.currency)}
              </p>
              <p className="text-xs text-muted">Earned</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Chef Score detail */}
      {isHelper && profile.chefScore !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-card p-5 flex items-center gap-6"
        >
          <ChefScore score={profile.chefScore} size="lg" />
          <div>
            <h3 className="font-bold text-charcoal">Chef Score</h3>
            <p className="text-sm text-muted mt-0.5 leading-relaxed">
              Based on delivery speed, quality ratings, and community reviews.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <ShieldCheck size={14} className="text-secondary-500" />
              <span className="text-xs text-secondary-700 font-medium">KinSous Verified</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Certifications */}
      {isHelper && profile.certificationBadges && profile.certificationBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-card p-5"
        >
          <h3 className="font-bold text-charcoal mb-3">
            Certifications ({profile.certificationBadges.length})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {profile.certificationBadges.map((badge, i) => (
              <CertificationBadge key={badge.id} badge={badge} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
