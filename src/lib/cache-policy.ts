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
    const vary = response.headers.get("Vary");
    if (!vary) {
      response.headers.set("Vary", "Cookie");
    } else if (!vary.split(",").some((value) => value.trim().toLowerCase() === "cookie")) {
      response.headers.set("Vary", `${vary}, Cookie`);
    }
  }

  return response;
}
