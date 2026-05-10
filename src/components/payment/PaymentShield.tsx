"use client";

import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle } from "lucide-react";
import type { PaymentEscrow } from "@/types";
import { formatCurrency } from "@/lib/mock-data";

interface PaymentShieldProps {
  escrow?: PaymentEscrow | null;
  amount?: number;
  currency?: "USD" | "NGN";
  compact?: boolean;
}

const statusConfig = {
  IDLE: { label: "Ready to Pay", color: "text-muted", bg: "bg-subtle border-card-border" },
  PENDING: { label: "Processing…", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  ESCROWED: { label: "Funds in Escrow", color: "text-secondary-700", bg: "bg-secondary-50 border-secondary-200" },
  RELEASED: { label: "Payment Released", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  REFUNDED: { label: "Refunded", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  FAILED: { label: "Payment Failed", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const providerEmoji: Record<string, string> = { STRIPE: "⚡", FLUTTERWAVE: "🦋" };

export default function PaymentShield({
  escrow, amount, currency = "USD", compact = false,
}: PaymentShieldProps) {
  const status = escrow?.status ?? "IDLE";
  const cfg = statusConfig[status];
  const displayAmount = escrow?.amount ?? amount;
  const displayCurrency = escrow?.currency ?? currency;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}
      >
        <Shield size={12} className="fill-current opacity-70" />
        {cfg.label}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 space-y-3 ${cfg.bg}`}
    >
      <div className="flex items-center gap-2">
        <motion.div
          animate={status === "ESCROWED" ? { scale: [1, 1.15, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
        >
          <Shield size={20} className={`${cfg.color} fill-current opacity-80`} />
        </motion.div>
        <div>
          <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
          {escrow?.provider && (
            <p className="text-xs text-muted">
              via {providerEmoji[escrow.provider]} {escrow.provider}
            </p>
          )}
        </div>
        {status === "ESCROWED" && <Lock size={14} className="ml-auto text-secondary-600" />}
      </div>

      {displayAmount !== undefined && (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-charcoal">
            {formatCurrency(displayAmount, displayCurrency)}
          </span>
          <span className="text-xs text-muted">held securely</span>
        </div>
      )}

      {escrow?.stripePaymentIntentId && (
        <p className="font-mono text-xs bg-input-surface/80 px-2 py-1 rounded-lg truncate text-muted">
          Stripe: {escrow.stripePaymentIntentId}
        </p>
      )}
      {escrow?.flutterwaveTransactionId && (
        <p className="font-mono text-xs bg-input-surface/80 px-2 py-1 rounded-lg truncate text-muted">
          Flutterwave: {escrow.flutterwaveTransactionId}
        </p>
      )}

      <div className="flex items-start gap-2 text-xs text-muted">
        <CheckCircle size={13} className="text-secondary-500 flex-shrink-0 mt-0.5" />
        <p>
          Funds are held in escrow and only released once you confirm delivery.
          100% refund if the Helper doesn't deliver.
        </p>
      </div>
    </motion.div>
  );
}
