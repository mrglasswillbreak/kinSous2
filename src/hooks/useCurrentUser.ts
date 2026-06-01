"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchJsonWithCache, invalidateClientCache, peekCachedJson } from "@/lib/client-cache";

export interface CurrentUser {
  userId: string;
  email: string | null;
  phone?: string | null;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
}

export function useCurrentUser() {
  const cachedUser = peekCachedJson<{ user?: CurrentUser | null }>("api:auth:me");
  const [user, setUser] = useState<CurrentUser | null>(cachedUser?.user ?? null);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (forceRefresh = true) => {
    setIsLoading(true);
    setError(null);
    try {
      if (forceRefresh) {
        invalidateClientCache("api:auth:me");
      }
      const data = await fetchJsonWithCache<{ user?: CurrentUser | null }>("/api/auth/me", {
        cacheKey: "api:auth:me",
        ttlMs: 30_000,
        forceRefresh,
      });
      setUser(data.user ?? null);
    } catch (err) {
      console.error("useCurrentUser: failed to fetch session", err);
      setError("Failed to load user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch(false);
  }, [refetch]);

  return { user, isLoading, error, refetch };
}
