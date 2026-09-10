"use client";
import { useEffect, useRef } from "react";
export function usePolling(refresh: () => Promise<unknown>, delay: number) {
  const current = useRef(refresh);
  current.current = refresh;
  useEffect(() => {
    let running = false;
    const tick = async () => {
      if (
        running ||
        !navigator.onLine ||
        document.visibilityState !== "visible"
      )
        return;
      running = true;
      try {
        await current.current();
      } finally {
        running = false;
      }
    };
    const interval = setInterval(tick, delay);
    window.addEventListener("focus", tick);
    window.addEventListener("kinsous:refresh", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
      window.removeEventListener("kinsous:refresh", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [delay]);
}
