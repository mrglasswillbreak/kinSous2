"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Bounty, BountyCategory, Profile, Bid } from "@/types";
import { dbBountyToAppBounty, dbUserToProfile } from "@/lib/mappers";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = filter?.category;
  const query = filter?.query;
  const status = filter?.status;

  const refetch = useCallback(() => {
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = null;
    }
    setIsLoading(true);
    setError(null);
    fetchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (category && category !== "ALL") params.set("category", category);
      if (status) params.set("status", status);
      if (query) params.set("q", query);
      fetchJson<{ bounties?: unknown[] }>(`/api/bounties?${params.toString()}`)
        .then((payload) => {
          const results = (payload?.bounties ?? []).map((b) => dbBountyToAppBounty(b as never));
          setData(results);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Failed to load bounties"));
        })
        .finally(() => {
          setIsLoading(false);
          fetchTimerRef.current = null;
        });
    }, 600);
  }, [category, query, status]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []);

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
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      fetchJson<{ helpers?: unknown[] }>(`/api/helpers?${params.toString()}`)
        .then((payload) => {
          let results = (payload?.helpers ?? []).map((u) => dbUserToProfile(u as never));
          if (minChefScore) {
            results = results.filter((h) => (h.chefScore ?? 0) >= minChefScore);
          }
          if (country) {
            results = results.filter(
              (h) => h.location.country.toLowerCase() === country.toLowerCase()
            );
          }
          setData(results);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Failed to load helpers"));
        })
        .finally(() => setIsLoading(false));
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
    const timer = setTimeout(() => {
      fetchJson<{ helpers?: unknown[] }>("/api/helpers")
        .then((payload) => {
          const profiles = (payload?.helpers ?? []).map((u) => dbUserToProfile(u as never));
          const found = profiles.find((h) => h.id === id) ?? null;
          setData(found);
        })
        .finally(() => setIsLoading(false));
    }, 400);
    return () => clearTimeout(timer);
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
      const [mePayload, bountyPayload] = await Promise.all([
        fetchJson<{ user?: { userId: string; name: string; avatarUrl?: string | null; city?: string | null; country?: string | null } }>("/api/auth/me"),
        fetchJson<{ bounty?: unknown }>(`/api/bounties/${encodeURIComponent(params.bountyId)}`),
      ]);
      const bounty = bountyPayload?.bounty ? dbBountyToAppBounty(bountyPayload.bounty as never) : null;
      const me = mePayload?.user;
      const helperProfile: Profile = {
        id: me?.userId ?? "me",
        name: me?.name ?? "You",
        avatarUrl:
          me?.avatarUrl ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(me?.userId ?? "me")}`,
        role: "HELPER",
        location: {
          city: me?.city || "Unknown",
          country: me?.country || "Unknown",
          countryCode: "XX",
        },
        createdAt: new Date().toISOString(),
      };
      const newBid: Bid = {
        id: `bid-${Math.random().toString(36).slice(2, 7)}`,
        bountyId: params.bountyId,
        helper: helperProfile,
        amount: params.amount,
        currency: bounty?.currency ?? "USD",
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
