"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Package, DollarSign, ShieldCheck, Edit3, Scroll, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/types";
import { formatCurrency, mockBounties, mockReviews, currentUser } from "@/lib/mock-data";
import ChefScore from "./ChefScore";
import CertificationBadge from "./CertificationBadge";

interface ProfileCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
}

export default function ProfileCard({ profile, isCurrentUser = false }: ProfileCardProps) {
  const isHelper = profile.role === "HELPER";

  // Bounties where this user is the seeker
  const myBounties = mockBounties.filter((b) => b.seeker.id === profile.id).slice(0, 3);
  // Bounties this helper has bid on
  const helperBounties = mockBounties
    .filter((b) => b.bids?.some((bid) => bid.helper.id === profile.id))
    .slice(0, 3);
  // Reviews written about this helper
  const reviews = mockReviews.filter((r) => r.targetId === profile.id);

  return (
    <div className="max-w-md mx-auto space-y-4 px-4 py-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl shadow-card overflow-hidden"
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
               className="w-20 h-20 rounded-2xl ring-4 ring-card object-cover shadow-md"
            />
            {isHelper && profile.chefScore !== undefined && (
              <div className="mb-1">
                <ChefScore score={profile.chefScore} size="sm" showLabel={false} />
              </div>
            )}
            {isCurrentUser && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="ml-auto mb-1 flex items-center gap-1.5 text-xs text-muted border border-card-border px-3 py-1.5 rounded-xl hover:bg-subtle transition-colors"
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
          className="bg-card rounded-3xl shadow-card p-5"
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
          className="bg-card rounded-3xl shadow-card p-5 flex items-center gap-6"
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
          className="bg-card rounded-3xl shadow-card p-5"
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

      {/* Reviews */}
      {isHelper && reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-3xl shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-charcoal">Reviews ({reviews.length})</h3>
            <div className="flex items-center gap-1">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-charcoal">
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex gap-3 bg-subtle rounded-2xl p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.authorAvatarUrl}
                  alt={review.authorName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-charcoal">{review.authorName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          size={10}
                           className={s < review.rating ? "text-yellow-400 fill-yellow-400" : "text-badge fill-badge"}
                         />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-charcoal mt-1 leading-relaxed">{review.comment}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Helper Jobs */}
      {isHelper && helperBounties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="bg-card rounded-3xl shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-charcoal flex items-center gap-2">
              <Scroll size={16} className="text-primary" /> Active Jobs
            </h3>
            <Link href="/bounties" className="text-xs text-primary font-semibold">Explore</Link>
          </div>
          <div className="space-y-2">
            {helperBounties.map((bounty) => (
              <Link key={bounty.id} href={`/bounties/${bounty.id}`} className="block">
                <div className="flex items-center gap-3 bg-subtle rounded-2xl p-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    bounty.status === "OPEN" ? "bg-secondary-500" :
                    bounty.status === "IN_PROGRESS" ? "bg-primary" :
                     bounty.status === "COMPLETED" ? "bg-muted" : "bg-red-400"
                   }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">{bounty.title}</p>
                    <p className="text-xs text-muted">{bounty.location.city} · {bounty.status.replace("_", " ")}</p>
                  </div>
                  <span className="text-xs font-bold text-secondary-700 flex-shrink-0">
                    {formatCurrency(bounty.budget, bounty.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* My Bounties (seeker view or current user) */}
      {(isCurrentUser || profile.id === currentUser.id) && myBounties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl shadow-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-charcoal flex items-center gap-2">
              <Scroll size={16} className="text-primary" /> My Bounties
            </h3>
            <Link href="/bounties" className="text-xs text-primary font-semibold">See all</Link>
          </div>
          <div className="space-y-2">
            {myBounties.map((bounty) => (
              <Link key={bounty.id} href={`/bounties/${bounty.id}`} className="block">
                <div className="flex items-center gap-3 bg-subtle rounded-2xl p-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    bounty.status === "OPEN" ? "bg-secondary-500" :
                    bounty.status === "IN_PROGRESS" ? "bg-primary" :
                     bounty.status === "COMPLETED" ? "bg-muted" : "bg-red-400"
                   }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">{bounty.title}</p>
                    <p className="text-xs text-muted">{bounty.location.city} · {bounty.status.replace("_", " ")}</p>
                  </div>
                  <span className="text-xs font-bold text-secondary-700 flex-shrink-0">
                    {formatCurrency(bounty.budget, bounty.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Message button for helpers */}
      {isHelper && !isCurrentUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link href="/messages">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-primary"
            >
              <MessageCircle size={18} /> Message {profile.name.split(" ")[0]}
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
