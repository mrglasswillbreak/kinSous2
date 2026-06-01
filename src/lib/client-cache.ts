"use client";

type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

interface FetchCacheOptions extends RequestInit {
  cacheKey?: string;
  ttlMs?: number;
  forceRefresh?: boolean;
}

const CACHE_PREFIX = "kinsous:client-cache:";
const DEFAULT_TTL_MS = 60_000;

const memoryCache = new Map<string, CacheEnvelope<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

function isBrowser() {
  return typeof window !== "undefined";
}

function fullKey(cacheKey: string) {
  return `${CACHE_PREFIX}${cacheKey}`;
}

function readFromStorage<T>(cacheKey: string): CacheEnvelope<T> | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(fullKey(cacheKey));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

function writeToStorage<T>(cacheKey: string, envelope: CacheEnvelope<T>) {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(fullKey(cacheKey), JSON.stringify(envelope));
  } catch {}
}

function resolveCache<T>(cacheKey: string) {
  const cached = (memoryCache.get(cacheKey) as CacheEnvelope<T> | undefined) ?? readFromStorage<T>(cacheKey);
  if (!cached) return null;
  memoryCache.set(cacheKey, cached);
  return cached;
}

function isFresh(expiresAt: number) {
  return Date.now() < expiresAt;
}

export function peekCachedJson<T>(cacheKey: string): T | null {
  const cached = resolveCache<T>(cacheKey);
  return cached?.value ?? null;
}

export function invalidateClientCache(cacheKeyPrefix: string) {
  const cacheKeyWithPrefix = fullKey(cacheKeyPrefix);

  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(cacheKeyPrefix)) {
      memoryCache.delete(key);
    }
  }

  if (!isBrowser()) return;

  for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
    const key = window.sessionStorage.key(i);
    if (key && key.startsWith(cacheKeyWithPrefix)) {
      window.sessionStorage.removeItem(key);
    }
  }
}

export async function fetchJsonWithCache<T>(
  url: string,
  options: FetchCacheOptions = {}
): Promise<T> {
  const {
    cacheKey = url,
    ttlMs = DEFAULT_TTL_MS,
    forceRefresh = false,
    ...init
  } = options;

  const cached = resolveCache<T>(cacheKey);
  if (!forceRefresh && cached && isFresh(cached.expiresAt)) {
    return cached.value;
  }

  if (!forceRefresh) {
    const pending = inflightRequests.get(cacheKey) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }
  }

  const request = fetch(url, init).then(async (res) => {
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  });

  inflightRequests.set(cacheKey, request);

  try {
    const value = await request;
    const envelope: CacheEnvelope<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    memoryCache.set(cacheKey, envelope as CacheEnvelope<unknown>);
    writeToStorage(cacheKey, envelope);
    return value;
  } catch (error) {
    if (cached) {
      return cached.value;
    }
    throw error;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}
