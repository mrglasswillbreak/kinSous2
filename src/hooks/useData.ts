"use client";

/**
 * Mock React Query-style hooks.
 * Ready to swap for real API calls once backend is wired.
 */

import { useState, useEffect, useCallback } from "react";
import type { Bounty, BountyCategory, Profile, Bid } from "@/types";
import { mockBounties, mockHelpers } from "@/lib/mock-data";

// ── useBounties ───────────────────────────────────────────────────────────────

interface BountiesFilter {
  category?: BountyCategory | "ALL";
  query?: string;
  status?: string;
}

export function useBounties(filter?: BountiesFilter) {
  const [data, setData] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const category = filter?.category;
  const query = filter?.query;
  const status = filter?.status;

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    // Simulate network latency
    setTimeout(() => {
      try {
        let results = [...mockBounties];
        if (category && category !== "ALL") {
          results = results.filter((b) => b.category === category);
        }
        if (status) {
          results = results.filter((b) => b.status === status);
        }
        if (query) {
          const q = query.toLowerCase();
          results = results.filter(
            (b) =>
              b.title.toLowerCase().includes(q) ||
              b.description.toLowerCase().includes(q) ||
              b.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load bounties"));
      } finally {
        setIsLoading(false);
      }
    }, 600);
  }, [category, query, status]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, isLoading, error, refetch };
}

// ── useHelpers ────────────────────────────────────────────────────────────────

interface HelpersFilter {
  query?: string;
  minChefScore?: number;
  country?: string;
}

export function useHelpers(filter?: HelpersFilter) {
  const [data, setData] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const query = filter?.query;
  const minChefScore = filter?.minChefScore;
  const country = filter?.country;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        let results = [...mockHelpers];
        if (query) {
          const q = query.toLowerCase();
          results = results.filter(
            (h) =>
              h.name.toLowerCase().includes(q) ||
              h.location.city.toLowerCase().includes(q) ||
              h.bio?.toLowerCase().includes(q)
          );
        }
        if (minChefScore) {
          results = results.filter((h) => (h.chefScore ?? 0) >= minChefScore);
        }
        if (country) {
          results = results.filter(
            (h) => h.location.country.toLowerCase() === country.toLowerCase()
          );
        }
        setData(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load helpers"));
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, minChefScore, country]);

  return { data, isLoading, error };
}

// ── useProfile ────────────────────────────────────────────────────────────────

export function useProfile(id: string) {
  const [data, setData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const found = mockHelpers.find((h) => h.id === id) ?? mockHelpers[0];
      setData(found);
      setIsLoading(false);
    }, 400);
  }, [id]);

  return { data, isLoading };
}

// ── usePlaceBid ───────────────────────────────────────────────────────────────

interface PlaceBidParams {
  bountyId: string;
  amount: number;
  message: string;
  estimatedDeliveryMinutes: number;
}

export function usePlaceBid() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Bid | null>(null);

  const placeBid = useCallback(async (params: PlaceBidParams) => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise<void>((r) => setTimeout(r, 900));
      const newBid: Bid = {
        id: `bid-${Math.random().toString(36).slice(2, 7)}`,
        bountyId: params.bountyId,
        helper: mockHelpers[0],
        amount: params.amount,
        currency: "USD",
        message: params.message,
        estimatedDeliveryMinutes: params.estimatedDeliveryMinutes,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      setData(newBid);
      return newBid;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Failed to place bid");
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { placeBid, isLoading, error, data };
}
