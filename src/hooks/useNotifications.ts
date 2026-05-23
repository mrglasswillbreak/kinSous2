"use client";

import { useState, useCallback, useEffect } from "react";
import type { AppNotification } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = await res.json();
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, dismiss, isLoading, refetch };
}
