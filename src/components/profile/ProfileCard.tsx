"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Package, DollarSign, ShieldCheck, Edit3, Scroll, MessageCircle, Loader2, Check, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile, Bounty } from "@/types";
import { formatCurrency, mockBounties, mockReviews } from "@/lib/mock-data";
import ChefScore from "./ChefScore";
import CertificationBadge from "./CertificationBadge";

interface ProfileCardProps {
  profile: Profile;
  isCurrentUser?: boolean;
  /** Real bounties from the DB, passed by a server parent. When provided, replaces mock data. */
  liveBounties?: Bounty[];
}

const COUNTRIES = ["Nigeria", "United States", "United Kingdom", "Canada", "Ghana", "Other"];

export default function ProfileCard({ profile, isCurrentUser = false, liveBounties }: ProfileCardProps) {
  const router = useRouter();
  const isHelper = profile.role === "HELPER";

  // Determine bounties to show
  const myBounties = liveBounties !== undefined
    ? liveBounties.slice(0, 5)
    : mockBounties.filter((b) => b.seeker.id === profile.id).slice(0, 3);
  const helperBounties = liveBounties !== undefined
    ? [] // helper jobs not yet fetched from DB for public profiles
    : mockBounties.filter((b) => b.bids?.some((bid) => bid.helper.id === profile.id)).slice(0, 3);
  const reviews = mockReviews.filter((r) => r.targetId === profile.id);

  // ── Inline edit form state ──────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio ?? "");
  const [editCity, setEditCity] = useState(profile.location.city !== "Unknown" ? profile.location.city : "");
  const [editCountry, setEditCountry] = useState(profile.location.country !== "Unknown" ? profile.location.country : "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(
    profile.avatarUrl && !profile.avatarUrl.startsWith("https://i.pravatar.cc") ? profile.avatarUrl : ""
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setEditError("Name is required"); return; }
    setEditLoading(true);
    setEditError("");
    setEditSuccess(false);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim() || null,
          city: editCity.trim() || null,
          country: editCountry || null,
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Update failed");
      } else {
        setEditSuccess(true);
        setTimeout(() => {
          setEditOpen(false);
          setEditSuccess(false);
          router.refresh();
        }, 1200);
      }
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl bg-input-surface border border-card-border text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition";

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
                onClick={() => { setEditOpen((v) => !v); setEditError(""); setEditSuccess(false); }}
                className="ml-auto mb-1 flex items-center gap-1.5 text-xs text-muted border border-card-border px-3 py-1.5 rounded-xl hover:bg-subtle transition-colors"
              >
                <Edit3 size={12} /> {editOpen ? "Cancel" : "Edit"}
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

        {/* Inline edit form */}
        <AnimatePresence>
          {isCurrentUser && editOpen && (
            <motion.form
              key="edit-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEditSubmit}
              className="overflow-hidden border-t border-card-border px-5 pb-5 pt-4 space-y-3"
            >
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Edit Profile</p>
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell people about yourself…"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-charcoal block mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Lagos"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-charcoal block mb-1">Country</label>
                  <div className="relative">
                    <select
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      <option value="">Select…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-charcoal block mb-1">Avatar URL (optional)</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </div>
              {editError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <X size={12} /> {editError}
                </p>
              )}
              {editSuccess && (
                <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Check size={12} /> Profile updated!
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={editLoading || editSuccess}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm shadow-primary disabled:opacity-60 transition"
              >
                {editLoading ? <Loader2 size={15} className="animate-spin" /> : <><Check size={14} /> Save Changes</>}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
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
      {isCurrentUser && myBounties.length > 0 && (
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

      {/* Empty state for current user with no bounties */}
      {isCurrentUser && myBounties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl shadow-card p-5 text-center"
        >
          <p className="text-3xl mb-2">🎯</p>
          <p className="font-semibold text-charcoal text-sm">No bounties yet</p>
          <p className="text-xs text-muted mt-1 mb-3">Post your first food request and get bids from local helpers.</p>
          <Link href="/bounties">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="text-sm bg-primary text-white px-5 py-2 rounded-xl font-semibold shadow-primary"
            >
              Post a Bounty
            </motion.button>
          </Link>
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
