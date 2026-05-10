import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_DURATION_DAYS } from "./auth-constants";

export { COOKIE_NAME, SESSION_DURATION_DAYS } from "./auth-constants";

const SECRET = process.env.AUTH_SECRET ?? "kinsous-dev-secret-change-in-prod";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

// ─── token helpers ────────────────────────────────────────────────────────────

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(data);
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload: SessionPayload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    );
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── cookie helpers ────────────────────────────────────────────────────────────

export async function setSessionCookie(payload: SessionPayload) {
  const token = createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { randomBytes };
