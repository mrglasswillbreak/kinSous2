import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { sql, usingLocalDb, getUserById } from "./db";
import { COOKIE_NAME, SESSION_DURATION_DAYS } from "./auth-constants";
export { COOKIE_NAME, SESSION_DURATION_DAYS } from "./auth-constants";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (
    process.env.NODE_ENV === "production" &&
    (!value || value.length < 32 || value.includes("your-secret"))
  )
    throw new Error("A strong AUTH_SECRET is required in production");
  return value || "kinsous-local-development-only-secret";
}
export interface SessionPayload {
  userId: string;
  email: string | null;
  phone?: string | null;
  name: string;
  role: string;
  exp: number;
  sessionId?: string;
}
function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}
export function createToken(payload: SessionPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return data + "." + sign(data);
}
export function verifyToken(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 0) return null;
    const data = token.slice(0, dot),
      signature = token.slice(dot + 1),
      expected = sign(data);
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
      return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return Number.isFinite(payload.exp) &&
      payload.exp > Date.now() &&
      typeof payload.userId === "string"
      ? payload
      : null;
  } catch {
    return null;
  }
}
export async function setSessionCookie(payload: SessionPayload) {
  if (!usingLocalDb()) {
    payload = { ...payload, sessionId: randomBytes(32).toString("hex") };
    await sql`INSERT INTO sessions (id,user_id,expires_at) VALUES (${payload.sessionId},${payload.userId},${new Date(payload.exp).toISOString()})`;
  }
  const jar = await cookies();
  jar.set(COOKIE_NAME, createToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * SESSION_DURATION_DAYS,
  });
}
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;
  if (!session) return null;
  if (!usingLocalDb()) {
    if (!session.sessionId) return null;
    const rows =
      await sql`SELECT s.id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=${session.sessionId} AND s.user_id=${session.userId} AND s.expires_at>now() AND u.suspended_at IS NULL`;
    if (!rows.length) return null;
  }
  const user = await getUserById(session.userId);
  return user
    ? { ...session, role: user.role, email: user.email, name: user.name }
    : null;
}
export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;
  if (session?.sessionId && !usingLocalDb())
    await sql`DELETE FROM sessions WHERE id=${session.sessionId}`;
  jar.delete(COOKIE_NAME);
}
export { randomBytes };
