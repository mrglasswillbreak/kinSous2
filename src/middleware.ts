import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/register", "/api/auth/seed"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Redirect authenticated users away from login
  if (pathname === "/login") {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Allow other public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
