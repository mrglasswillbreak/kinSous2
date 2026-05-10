import { cookies } from "next/headers";
import { createHash, randomUUID } from "crypto";

export const SESSION_COOKIE = "kinsous_session";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function makeSessionToken() {
  return randomUUID();
}

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
