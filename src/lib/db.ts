import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set. See .env.local.example for setup instructions.");
    }
    _client = neon(process.env.DATABASE_URL);
  }
  return _client;
}

/** Tagged-template SQL helper (lazy — safe to import without DATABASE_URL at build time) */
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (function sqlProxyTarget() {
    // Calls are handled by the Proxy apply trap.
  }) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getClient() as any)(...args);
    },
    get(_target, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getClient() as any)[prop];
    },
  }
);

/**
 * Initialise the users table if it doesn't exist yet.
 * Safe to call on every request (uses IF NOT EXISTS).
 */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url    TEXT,
      role          TEXT NOT NULL DEFAULT 'SEEKER',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}
