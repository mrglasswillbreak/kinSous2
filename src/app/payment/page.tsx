"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { usePaymentEscrow } from "@/hooks/usePaymentEscrow";
import PaymentShield from "@/components/payment/PaymentShield";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { dbBountyToAppBounty, dbUserToProfile } from "@/lib/mappers";
import type { Bounty, Profile } from "@/types";

export default function PaymentPage() {
  const { escrow, isLoading, error, initializeEscrow, releaseEscrow, refundEscrow } =
    usePaymentEscrow();
  const { user } = useCurrentUser();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [helper, setHelper] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    setLoadingData(true);
    Promise.all([
      fetch(`/api/bounties?seekerId=${encodeURIComponent(user.userId)}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/helpers").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([bountyData, helperData]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bounties = (bountyData?.bounties ?? []).map((b: any) => dbBountyToAppBounty(b));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const helpers = (helperData?.helpers ?? []).map((u: any) => dbUserToProfile(u));
        setBounty(bounties[0] ?? null);
        setHelper(helpers[0] ?? null);
      })
      .catch(() => {
        setBounty(null);
        setHelper(null);
      })
      .finally(() => setLoadingData(false));
  }, [user?.userId]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Escrow Payment</h1>
        <p className="text-muted text-sm mt-1">Dual-market gateway: Stripe (US) · Flutterwave (NG)</p>
      </div>

      {bounty ? (
        <div className="bg-card rounded-3xl shadow-card p-4">
          <h2 className="font-bold text-charcoal mb-1 text-sm">Bounty</h2>
          <p className="text-charcoal">{bounty.title}</p>
          <p className="text-muted text-sm mt-0.5">{bounty.location.city}, {bounty.location.country}</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-card p-4 border border-card-border text-center">
          <h2 className="font-bold text-charcoal mb-1 text-sm">Bounty</h2>
          <p className="text-sm text-muted">{loadingData ? "Loading…" : "Post a bounty first to use escrow."}</p>
        </div>
      )}

      <PaymentShield escrow={escrow} amount={bounty?.budget ?? 0} currency={bounty?.currency ?? "NGN"} />

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-2xl px-4 py-3">{error.message}</p>
      )}

      <div className="space-y-3">
        {!escrow && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (!bounty || !helper || !user?.userId) return;
              initializeEscrow({
                bountyId: bounty.id,
                amount: bounty.budget,
                currency: bounty.currency,
                seekerId: user.userId,
                helperId: helper.id,
              });
            }}
            disabled={isLoading || !bounty || !helper || !user?.userId}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3.5 rounded-2xl font-bold shadow-secondary disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {isLoading ? "Processing…" : "Pay into Escrow"}
          </motion.button>
        )}

        {escrow?.status === "ESCROWED" && bounty && (
          <>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => releaseEscrow(bounty.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl font-bold shadow-primary disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "✅"}
              Confirm Delivery &amp; Release
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => refundEscrow(bounty.id)}
              disabled={isLoading}
              className="w-full bg-card text-red-600 border border-red-200 py-3.5 rounded-2xl font-bold disabled:opacity-60"
            >
              Request Refund
            </motion.button>
          </>
        )}

        {(escrow?.status === "RELEASED" || escrow?.status === "REFUNDED") && (
          <div className="text-center text-muted text-sm py-4">
            Transaction complete.
          </div>
        )}
      </div>

      <div className="text-xs text-muted space-y-1.5 bg-subtle rounded-2xl p-4">
        <p><strong>US payments:</strong> Powered by Stripe – USD escrow</p>
        <p><strong>NG payments:</strong> Powered by Flutterwave – NGN escrow</p>
        <p>Provider is automatically detected from the bounty&apos;s currency.</p>
      </div>
    </div>
  );
}
