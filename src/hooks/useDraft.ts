"use client";
import { useEffect, useRef, useState } from "react";
import { draftOperation } from "@/lib/drafts";
export function useDraft<T>(
  userId: string | undefined,
  name: string,
  value: T,
  restore: (value: T) => void,
  enabled = true,
) {
  const key = userId ? userId + ":" + name : null;
  const [loaded, setLoaded] = useState<string | null>(null);
  const current = useRef(value);
  const discarded = useRef<string | null>(null);
  current.current = value;
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  useEffect(() => {
    if (!key || !enabled) return;
    let active = true;
    draftOperation<T>(key, "read").then((saved) => {
      if (!active) return;
      if (saved !== undefined) restoreRef.current(saved);
      setLoaded(key);
    });
    return () => {
      active = false;
    };
  }, [key, enabled]);
  useEffect(() => {
    if (!key || loaded !== key || !enabled) return;
    const save = () => JSON.stringify(current.current) === discarded.current ? Promise.resolve(undefined) : draftOperation(key, "write", current.current);
    void save();
    const flush = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.pending) detail.pending.push(save());
      else void save();
    };
    window.addEventListener("kinsous:flush-drafts", flush);
    return () => window.removeEventListener("kinsous:flush-drafts", flush);
  }, [key, value, loaded, enabled]);
  return {
    clear: async (resetValue: T = current.current) => {
      discarded.current = JSON.stringify(resetValue);
      if (key) await draftOperation(key, "delete");
    },
    ready: Boolean(key && loaded === key),
  };
}
