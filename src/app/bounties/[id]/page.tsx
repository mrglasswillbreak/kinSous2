"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Tag, Users, DollarSign, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mockBounties, formatCurrency, timeAgo, categoryLabels, categoryColors } from "@/lib/mock-data";
import BidSection from "@/components/feed/BidSection";

interface Props {
  params: Promise<{ id: string }>;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-secondary-50 text-secondary-700 border border-secondary-200",
  IN_PROGRESS: "bg-primary-50 text-primary-700 border border-primary-200",
  AWAITING_APPROVAL: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  COMPLETED: "bg-gray-100 text-gray-600 border border-gray-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
};

export default function BountyDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const bounty = mockBounties.find((b) => b.id === id);

  if (!bounty) {
    return (
      <div className="max-w-md mx-auto px-4 pt-12 pb-24 text-center">
        <p className="text-4xl mb-3">🍽️</p>
        <p className="text-xl font-bold text-charcoal">Bounty not found</p>
        <p className="text-muted text-sm mt-2">This bounty may have been removed.</p>
        <Link href="/bounties">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="mt-6 bg-primary text-white px-6 py-2.5 rounded-2xl font-semibold shadow-primary"
          >
            Back to Bounties
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm"
        >
          <ArrowLeft size={18} className="text-charcoal" />
        </motion.button>
        <h1 className="text-lg font-bold text-charcoal truncate flex-1">Bounty Detail</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusColors[bounty.status]}`}>
          {bounty.status.replace("_", " ")}
        </span>
      </div>

      <div className="px-4 space-y-4 mt-2">
        {/* Hero image */}
        {bounty.imageUrls && bounty.imageUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl overflow-hidden h-48 shadow-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bounty.imageUrls[0]}
              alt={bounty.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Main info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl shadow-card p-5 space-y-4"
        >
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bounty.seeker.avatarUrl}
              alt={bounty.seeker.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-charcoal text-sm">{bounty.seeker.name}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                <span className="flex items-center gap-1"><MapPin size={11} />{bounty.location.city}, {bounty.location.country}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(bounty.createdAt)}</span>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${categoryColors[bounty.category]}`}>
              {categoryLabels[bounty.category]}
            </span>
          </div>

          <h2 className="text-xl font-bold text-charcoal leading-snug">{bounty.title}</h2>
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
        </motion.div>

        {/* Budget & location */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-secondary-50 flex items-center justify-center">
                <DollarSign size={14} className="text-secondary-600" />
              </div>
              <span className="text-xs text-muted font-medium">Budget</span>
            </div>
            <p className="text-xl font-bold text-secondary-700">
              {formatCurrency(bounty.budget, bounty.currency)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                <Users size={14} className="text-primary" />
              </div>
              <span className="text-xs text-muted font-medium">Bids</span>
            </div>
            <p className="text-xl font-bold text-charcoal">{bounty.bids?.length ?? 0}</p>
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-card p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-charcoal text-sm">{bounty.location.address}</p>
            <p className="text-xs text-muted">{bounty.location.city}, {bounty.location.country}</p>
          </div>
        </motion.div>

        {/* Video assist prompt */}
        {bounty.category === "COOKING" || bounty.category === "RECIPE_HELP" ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/video">
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-4 flex items-center gap-3 border border-primary-100">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Video size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal">FaceTime Assist available</p>
                  <p className="text-xs text-muted">Shop live with a helper via video call</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ) : null}

        {/* Bids section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl shadow-card p-5"
        >
          <BidSection bounty={bounty} />
        </motion.div>
      </div>
    </div>
  );
}
