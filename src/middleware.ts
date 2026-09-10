import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { COOKIE_NAME } from "@/lib/auth-constants";
async function validSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const [data, signature, ...rest] = token.split(".");
    if (rest.length || !data || !signature) return false;
    const decode = (s: string) =>
      Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
        c.charCodeAt(0),
      );
    const secret =
      process.env.AUTH_SECRET ||
      (process.env.NODE_ENV !== "production"
        ? "kinsous-local-development-only-secret"
        : "");
    if (!secret) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        key,
        decode(signature),
        new TextEncoder().encode(data),
      ))
    )
      return false;
    const session = JSON.parse(new TextDecoder().decode(decode(data)));
    if (!Number.isFinite(session.exp) || session.exp <= Date.now())
      return false;
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      const rows =
        await sql`SELECT s.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=${session.sessionId || ""} AND s.user_id=${session.userId} AND s.expires_at>now() AND u.suspended_at IS NULL`;
      return rows.length > 0;
    }
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const assets =
    path.startsWith("/_next/") ||
    [
      "/sw.js",
      "/site.webmanifest",
      "/offline.html",
      "/avatar.svg",
      "/favicon.ico",
      "/robots.txt",
    ].includes(path) ||
    /^\/(android-chrome-|apple-touch-icon|favicon-|mstile-|safari-pinned-tab|browserconfig)/.test(
      path,
    );
  if (assets) return NextResponse.next();
  const machine =
    path === "/api/payments/webhook" || path === "/api/jobs/reconcile";
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (mutating && !machine) {
    const origin = request.headers.get("origin");
    if (
      origin !== request.nextUrl.origin &&
      !(process.env.NODE_ENV !== "production" && !origin)
    )
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    if (Number(request.headers.get("content-length") || 0) > 9 * 1024 * 1024)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      const ip =
        request.headers.get("x-vercel-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown";
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(ip + ":" + path),
      );
      const key = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const limit = path.startsWith("/api/auth/") ? 20 : 180;
      try {
        const rows =
          await sql`INSERT INTO rate_limits(key,count,reset_at) VALUES(${key},1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING count`;
        if (Number(rows[0].count) > limit)
          return NextResponse.json(
            { error: "Too many requests. Try again later." },
            { status: 429, headers: { "Retry-After": "900" } },
          );
      } catch {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 },
        );
      }
    }
  }
  const publicAuth = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/recover",
    "/api/auth/verify",
  ];
  const publicPage = ["/login", "/recover", "/reset-password"];
  const publicRead =
    request.method === "GET" &&
    (path === "/api/helpers" ||
      path === "/api/bounties" ||
      /^\/api\/bounties\/[^/]+$/.test(path) ||
      path === "/api/health");
  if (
    machine ||
    publicAuth.includes(path) ||
    publicRead ||
    (path === "/api/auth/seed" && process.env.NODE_ENV !== "production")
  )
    return NextResponse.next();
  if (publicPage.includes(path)) return NextResponse.next();
  if (!(await validSession(request))) {
    if (path.startsWith("/api/"))
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
