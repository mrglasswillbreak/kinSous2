"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Bounty, BountyCategory, Profile, Bid } from "@/types";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import { fetchJsonWithCache, invalidateClientCache } from "@/lib/client-cache";
import { dbBidToAppBid, dbBountyToAppBounty, dbUserToProfile } from "@/lib/mappers";

async function fetchJson<T>(url: string, opts?: { forceRefresh?: boolean; ttlMs?: number; cacheKey?: string }): Promise<T | null> {
  try {
    return await fetchJsonWithCache<T>(url, {
      cacheKey: opts?.cacheKey ?? url,
      ttlMs: opts?.ttlMs ?? 45_000,
      forceRefresh: opts?.forceRefresh ?? false,
    });
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

  const load = useCallback((forceRefresh: boolean) => {
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
      const queryString = params.toString();
      const url = `/api/bounties${queryString ? `?${queryString}` : ""}`;
      const cacheKey = `api:bounties:${queryString}`;
      if (forceRefresh) {
        invalidateClientCache(cacheKey);
      }
      fetchJson<{ bounties?: unknown[] }>(url, { forceRefresh, cacheKey, ttlMs: 30_000 })
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
    }, SEARCH_DEBOUNCE_MS);
  }, [category, query, status]);

  const refetch = useCallback(() => load(true), [load]);

  useEffect(() => {
    load(false);
  }, [load]);
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
      const queryString = params.toString();
      const url = `/api/helpers${queryString ? `?${queryString}` : ""}`;
      fetchJson<{ helpers?: unknown[] }>(url, { cacheKey: `api:helpers:${queryString}`, ttlMs: 45_000 })
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
    }, SEARCH_DEBOUNCE_MS);
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
      fetchJson<{ helpers?: unknown[] }>("/api/helpers", { cacheKey: "api:helpers:", ttlMs: 45_000 })
        .then((payload) => {
          const profiles = (payload?.helpers ?? []).map((u) => dbUserToProfile(u as never));
          const found = profiles.find((h) => h.id === id) ?? null;
          setData(found);
        })
        .finally(() => setIsLoading(false));
    }, SEARCH_DEBOUNCE_MS);
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
      const res = await fetch(`/api/bounties/${encodeURIComponent(params.bountyId)}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to place bid");
      }
      const newBid = dbBidToAppBid(payload.bid as never);
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
