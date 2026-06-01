"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppNotification } from "@/types";
import { fetchJsonWithCache, invalidateClientCache, peekCachedJson } from "@/lib/client-cache";

export function useNotifications() {
  const cachedNotifications = peekCachedJson<{ notifications?: AppNotification[] }>("api:notifications");
  const [notifications, setNotifications] = useState<AppNotification[]>(cachedNotifications?.notifications ?? []);
  const [isLoading, setIsLoading] = useState(!cachedNotifications);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchJsonWithCache<{ notifications?: AppNotification[] }>("/api/notifications", {
        cacheKey: "api:notifications",
        ttlMs: 15_000,
      });
      setNotifications(data.notifications ?? []);
    } catch (err) {
      console.error("useNotifications: failed to load notifications", err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const stream = new EventSource("/api/messages/stream");
    const handleNotification = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as AppNotification;
      setNotifications((prev) => [payload, ...prev.filter((n) => n.id !== payload.id)]);
    };
    stream.addEventListener("notification", handleNotification);
    stream.addEventListener("error", refetch);
    return () => {
      stream.close();
    };
  }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    invalidateClientCache("api:notifications");
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    invalidateClientCache("api:notifications");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    invalidateClientCache("api:notifications");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, dismiss, isLoading, refetch };
}
