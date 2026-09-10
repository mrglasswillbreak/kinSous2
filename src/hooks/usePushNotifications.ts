"use client";
import { useCallback, useEffect, useState } from "react";
export function usePushNotifications() {
  const [isSupported, setSupported] = useState(false),
    [permission, setPermission] = useState<NotificationPermission>("default"),
    [isSubscribed, setSubscribed] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(supported);
    if (supported) setPermission(Notification.permission);
  }, []);
  useEffect(() => {
    if (!isSupported) return;
    let active = true;
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const r = await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub),
          });
          if (active) setSubscribed(r.ok);
        }
      })
      .catch(() => {
        if (active) setError("Could not check notification settings.");
      });
    return () => {
      active = false;
    };
  }, [isSupported]);
  const subscribe = useCallback(async () => {
    setError("");
    try {
      if (!isSupported)
        throw Error(
          "Notifications are not supported in this browser. On iPhone, install KinSous on your Home Screen first.",
        );
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw Error("Push notifications are not configured yet.");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setError(
          "Notifications are disabled. You can change this in your browser settings.",
        );
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!response.ok)
        throw Error("Could not save notification settings. Please try again.");
      setSubscribed(true);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not enable notifications",
      );
      return false;
    }
  }, [isSupported]);
  const unsubscribe = useCallback(async () => {
    setError("");
    try {
      if (!isSupported) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const r = await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        if (!r.ok)
          throw Error("Could not disable notifications. Please retry.");
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not disable notifications",
      );
    }
  }, [isSupported]);
  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    error,
  };
}
