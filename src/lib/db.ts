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
      bio           TEXT,
      city          TEXT,
      country       TEXT,
      country_code  TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Add profile columns to existing tables that pre-date this migration
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT`;
}

/**
 * Initialise the bounties table if it doesn't exist yet.
 * Safe to call on every request (uses IF NOT EXISTS).
 */
export async function initBounties() {
  await initDb();
  await sql`
    CREATE TABLE IF NOT EXISTS bounties (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'OTHER',
      status      TEXT NOT NULL DEFAULT 'OPEN',
      budget      NUMERIC NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'NGN',
      seeker_id   TEXT NOT NULL REFERENCES users(id),
      address     TEXT,
      city        TEXT,
      country     TEXT,
      tags        TEXT[],
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// ─── User types & helpers ─────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string;
}

/** Fetch a single user by ID; returns null if not found. */
export async function getUserById(id: string): Promise<DbUser | null> {
  await initDb();
  const rows = await sql`
    SELECT id, email, name, password_hash, avatar_url, role, bio, city, country, country_code, created_at
    FROM users
    WHERE id = ${id}
  `;
  return (rows[0] as DbUser) ?? null;
}

/** Fetch users with role = HELPER, optionally filtering by query string. */
export async function getHelpers(query?: string): Promise<DbUser[]> {
  await initDb();
  if (query) {
    const q = `%${query}%`;
    const rows = await sql`
      SELECT id, email, name, avatar_url, role, bio, city, country, country_code, created_at
      FROM users
      WHERE role = 'HELPER'
        AND (name ILIKE ${q} OR city ILIKE ${q} OR bio ILIKE ${q})
      ORDER BY created_at DESC
    `;
    return rows as DbUser[];
  }
  const rows = await sql`
    SELECT id, email, name, avatar_url, role, bio, city, country, country_code, created_at
    FROM users
    WHERE role = 'HELPER'
    ORDER BY created_at DESC
  `;
  return rows as DbUser[];
}

// ─── Bounty types & helpers ───────────────────────────────────────────────────

export interface DbBounty {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: string; // numeric from postgres comes as string
  currency: string;
  seeker_id: string;
  address: string | null;
  city: string | null;
  country: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // joined seeker fields
  seeker_name: string;
  seeker_avatar_url: string | null;
  seeker_city: string | null;
  seeker_country: string | null;
}

export interface CreateBountyParams {
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  seekerId: string;
  address: string;
  city: string;
  country: string;
  tags: string[];
}

/** List bounties with optional filters (category, status, text query). */
export async function getBounties(opts?: {
  category?: string;
  status?: string;
  query?: string;
}): Promise<DbBounty[]> {
  await initBounties();
  const rows = await sql`
    SELECT
      b.id, b.title, b.description, b.category, b.status,
      b.budget, b.currency, b.seeker_id,
      b.address, b.city, b.country, b.tags,
      b.created_at, b.updated_at,
      u.name  AS seeker_name,
      u.avatar_url AS seeker_avatar_url,
      u.city  AS seeker_city,
      u.country AS seeker_country
    FROM bounties b
    JOIN users u ON u.id = b.seeker_id
    ORDER BY b.created_at DESC
  `;
  let results = rows as DbBounty[];
  if (opts?.category && opts.category !== "ALL") {
    results = results.filter((r) => r.category === opts.category);
  }
  if (opts?.status) {
    results = results.filter((r) => r.status === opts.status);
  }
  if (opts?.query) {
    const q = opts.query.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  return results;
}

/** Fetch a single bounty by ID with joined seeker info. */
export async function getBountyById(id: string): Promise<DbBounty | null> {
  await initBounties();
  const rows = await sql`
    SELECT
      b.id, b.title, b.description, b.category, b.status,
      b.budget, b.currency, b.seeker_id,
      b.address, b.city, b.country, b.tags,
      b.created_at, b.updated_at,
      u.name  AS seeker_name,
      u.avatar_url AS seeker_avatar_url,
      u.city  AS seeker_city,
      u.country AS seeker_country
    FROM bounties b
    JOIN users u ON u.id = b.seeker_id
    WHERE b.id = ${id}
  `;
  return (rows[0] as DbBounty) ?? null;
}

/** Insert a new bounty and return it. */
export async function createBounty(p: CreateBountyParams): Promise<DbBounty> {
  await initBounties();
  const rows = await sql`
    INSERT INTO bounties
      (title, description, category, budget, currency, seeker_id, address, city, country, tags)
    VALUES
      (${p.title}, ${p.description}, ${p.category}, ${p.budget}, ${p.currency},
       ${p.seekerId}, ${p.address}, ${p.city}, ${p.country}, ${p.tags})
    RETURNING *
  `;
  // Re-fetch with joined seeker to keep shape consistent
  return getBountyById((rows[0] as { id: string }).id) as Promise<DbBounty>;
}

