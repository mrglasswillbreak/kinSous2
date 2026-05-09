"use client";

import { useState, useCallback } from "react";
import type {
  PaymentEscrow,
  UsePaymentEscrowReturn,
  InitializeEscrowParams,
  PaymentProvider,
} from "@/types";

function detectProvider(currency: "USD" | "NGN"): PaymentProvider {
  return currency === "USD" ? "STRIPE" : "FLUTTERWAVE";
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * usePaymentEscrow – dual-market escrow hook.
 * Routes to Stripe (USD) or Flutterwave (NGN) automatically.
 */
export function usePaymentEscrow(): UsePaymentEscrowReturn {
  const [escrow, setEscrow] = useState<PaymentEscrow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeEscrow = useCallback(async (params: InitializeEscrowParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = detectProvider(params.currency);
      await new Promise<void>((r) => setTimeout(r, 1200));
      setEscrow({
        id: uid(),
        bountyId: params.bountyId,
        amount: params.amount,
        currency: params.currency,
        provider,
        status: "ESCROWED",
        seekerId: params.seekerId,
        helperId: params.helperId,
        ...(provider === "STRIPE"
          ? { stripePaymentIntentId: `pi_${uid()}` }
          : { flutterwaveTransactionId: `FLW-${uid().toUpperCase()}` }),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Escrow init failed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const releaseEscrow = useCallback(async (bountyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise<void>((r) => setTimeout(r, 800));
      setEscrow((prev) =>
        prev?.bountyId === bountyId
          ? { ...prev, status: "RELEASED", releasedAt: new Date().toISOString() }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Release failed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refundEscrow = useCallback(async (bountyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise<void>((r) => setTimeout(r, 800));
      setEscrow((prev) =>
        prev?.bountyId === bountyId ? { ...prev, status: "REFUNDED" } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Refund failed"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { escrow, isLoading, error, initializeEscrow, releaseEscrow, refundEscrow };
}
