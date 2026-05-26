import { NextResponse } from "next/server";

export const CACHE_POLICY = {
  publicSWR: "public, max-age=30, stale-while-revalidate=300",
  privateSWR: "private, max-age=10, stale-while-revalidate=60",
  privateNoStore: "private, no-store",
} as const;

export function withCacheControl<T>(
  response: NextResponse<T>,
  cacheControl: string,
  options?: { varyCookie?: boolean }
) {
  response.headers.set("Cache-Control", cacheControl);

  if (options?.varyCookie) {
    response.headers.set("Vary", "Cookie");
  }

  return response;
}
