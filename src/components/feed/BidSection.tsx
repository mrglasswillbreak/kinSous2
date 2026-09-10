"use client";

import Image from "@/components/ui/AppImage";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, MessageCircle, Send, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Bounty } from "@/types";
import { formatCurrency, timeAgo } from "@/lib/mock-data";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePlaceBid } from "@/hooks/useData";

interface BidSectionProps {
  bounty: Bounty;
  onChanged?: () => void;
}

export default function BidSection({ bounty, onChanged }: BidSectionProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { placeBid, isLoading: placingBid } = usePlaceBid();
  const [msg, setMsg] = useState("");
  const [amt, setAmt] = useState("");
  const [eta, setEta] = useState("60");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const bids = bounty.bids ?? [];
  const isPoster = user?.userId === bounty.seeker.id;
  const acceptedBid = bids.find((bid) => bid.status === "ACCEPTED");
  const myBid = bids.find((bid) => bid.helper.id === user?.userId);
  const canBid =
    bounty.status === "OPEN" && user?.role === "HELPER" && !isPoster;
  const canManageAccepted = Boolean(isPoster && acceptedBid);
  const canCancelBounty = Boolean(
    isPoster && bounty.status === "OPEN" && !acceptedBid,
  );
  const handleSubmit = async () => {
    if (!msg.trim() || !amt || placingBid) return;
    setFeedback(null);
    try {
      await placeBid({
        bountyId: bounty.id,
        amount: Number(amt),
        message: msg.trim(),
        estimatedDeliveryMinutes: Number(eta) || 60,
      });
      setFeedback(
        myBid
          ? "Bid updated across the bounty board."
          : "Bid posted across the bounty board.",
      );
      setMsg("");
      setAmt("");
      setEta("60");
      onChanged?.();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to place bid.");
    }
  };

  const handleAccept = async (bidId: string) => {
    if (acceptingId) return;
    setAcceptingId(bidId);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/bounties/${encodeURIComponent(bounty.id)}/bids/${encodeURIComponent(bidId)}/accept`,
        {
          method: "POST",
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error ?? "Failed to accept bid.");
      setFeedback(
        "Bid accepted. Contact controls are now available for the selected helper.",
      );
      onChanged?.();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to accept bid.");
    } finally {
      setAcceptingId(null);
    }
  };

  const openConversation = async () => {
    if (!acceptedBid || contacting) return;
    setContacting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helperId: acceptedBid.helper.id,
          bountyId: bounty.id,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(payload?.error ?? "Unable to open contacts.");
      router.push(`/contacts/${payload.conversationId}`);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Unable to open contacts.",
      );
      setContacting(false);
    }
  };

  const handleCancel = async () => {
    if (!canCancelBounty || cancelling) return;
    setCancelling(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/bounties/${encodeURIComponent(bounty.id)}/cancel`,
        {
          method: "POST",
        },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(payload?.error ?? "Unable to cancel bounty.");
      setFeedback("Bounty cancelled. Bidders were notified.");
      onChanged?.();
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Unable to cancel bounty.",
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="space-y-4"
      aria-busy={placingBid || Boolean(acceptingId) || contacting || cancelling}
    >
      {acceptedBid && (isPoster || myBid?.status === "ACCEPTED") && (
        <Link
          href={"/payment?bountyId=" + encodeURIComponent(bounty.id)}
          className="block w-full rounded-xl bg-primary text-white py-3 text-center font-semibold"
        >
          View order, payment & delivery
        </Link>
      )}
      {bids.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Bids ({bids.length})
          </h4>
          <div className="space-y-2">
            {bids.map((bid, i) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex flex-col gap-3 rounded-2xl p-3 border ${
                  bid.status === "ACCEPTED"
                    ? "bg-secondary-50 border-secondary-200"
                    : "bg-subtle border-transparent"
                }`}
              >
                <div className="flex gap-3">
                  <Image
                    width={40}
                    height={40}
                    src={bid.helper.avatarUrl}
                    alt={bid.helper.name}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover ring-2 ring-primary-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-charcoal truncate block">
                          {bid.helper.name}
                        </span>
                        {bid.status === "ACCEPTED" && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-secondary-700 bg-white/80 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Selected
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-secondary-700 text-sm flex-shrink-0">
                        {formatCurrency(bid.amount, bid.currency)}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {bid.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />~{bid.estimatedDeliveryMinutes} min
                      </span>
                      <span>{timeAgo(bid.createdAt)}</span>
                      {bid.helper.id === user?.userId && (
                        <span className="font-semibold text-primary">
                          Your bid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isPoster &&
                  bounty.status === "OPEN" &&
                  bid.status === "PENDING" && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAccept(bid.id)}
                      disabled={Boolean(acceptingId)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-600 text-white py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
                    >
                      {acceptingId === bid.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Accept bid
                    </motion.button>
                  )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {canManageAccepted && acceptedBid && (
        <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-3 space-y-3">
          <div>
            <p className="text-sm font-bold text-charcoal">
              Selected bidder: {acceptedBid.helper.name}
            </p>
            <p className="text-xs text-muted mt-0.5">
              Only the bounty poster can open bounty-linked contact controls.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openConversation}
              disabled={contacting}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 text-sm font-semibold shadow-primary disabled:opacity-60"
            >
              {contacting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <MessageCircle size={14} />
              )}
              Message
            </motion.button>
          </div>
        </div>
      )}

      {!isPoster &&
        myBid?.status === "ACCEPTED" &&
        ["IN_PROGRESS", "INCOMPLETE"].includes(bounty.status) && (
          <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-3 text-sm text-charcoal">
            Your bid was accepted. Coordinate delivery with the poster in
            Messages.
          </div>
        )}

      {canBid && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
            {myBid ? "Update Your Bid" : "Place a Bid"}
          </h4>
          <div className="grid grid-cols-[minmax(90px,120px)_minmax(76px,96px)_1fr] gap-2 max-sm:grid-cols-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">
                {bounty.currency === "USD" ? "$" : "₦"}
              </span>
              <input
                aria-label="Bid amount"
                type="number"
                placeholder="Amount"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="w-full pl-6 pr-2 py-2.5 text-sm border border-card-border rounded-xl bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <input
              aria-label="Estimated minutes"
              type="number"
              min={5}
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-card-border rounded-xl bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="text"
              placeholder="Your pitch…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="min-w-0 px-3 py-2.5 text-sm border border-card-border rounded-xl bg-input-surface text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 max-sm:col-span-2"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted bg-secondary-50 rounded-xl px-3 py-2">
            <Shield size={13} className="text-secondary-600 flex-shrink-0" />
            <span>
              10% platform commission. Helper payout follows confirmed delivery.
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={!msg.trim() || !amt || placingBid}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placingBid ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {myBid ? "Update Bid" : "Submit Bid"}
          </motion.button>
        </div>
      )}

      {canCancelBounty && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {cancelling ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          Cancel bounty
        </motion.button>
      )}

      {isPoster && bounty.status === "OPEN" && bids.length === 0 && (
        <div className="rounded-2xl bg-subtle border border-card-border p-3 text-sm text-muted">
          New bids will appear here for you to accept.
        </div>
      )}

      {feedback && (
        <div className="rounded-xl bg-badge border border-card-border px-3 py-2 text-xs text-charcoal">
          {feedback}
        </div>
      )}
    </div>
  );
}
