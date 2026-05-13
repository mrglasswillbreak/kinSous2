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

export interface UpdateBountyParams {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  budget?: number;
  currency?: string;
  address?: string;
  city?: string;
  country?: string;
  tags?: string[];
}

/** List bounties with optional filters (category, status, text query, seekerId). */
export async function getBounties(opts?: {
  category?: string;
  status?: string;
  query?: string;
  seekerId?: string;
}): Promise<DbBounty[]> {
  await initBounties();

  // Apply seekerId in SQL to avoid transferring unneeded rows from the DB.
  const rows = opts?.seekerId
    ? await sql`
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
        WHERE b.seeker_id = ${opts.seekerId}
        ORDER BY b.created_at DESC
      `
    : await sql`
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
  const created = rows[0] as { id: string } | undefined;
  if (!created?.id) {
    throw new Error("Failed to create bounty");
  }
  // Re-fetch with joined seeker to keep shape consistent
  const bounty = await getBountyById(created.id);
  if (!bounty) {
    throw new Error("Failed to load created bounty");
  }
  return bounty;
}

/** Update a bounty if owned by seekerId; returns updated bounty or null. */
export async function updateBounty(id: string, seekerId: string, p: UpdateBountyParams): Promise<DbBounty | null> {
  await initBounties();
  const rows = await sql`
    UPDATE bounties
    SET
      title = COALESCE(${p.title ?? null}, title),
      description = COALESCE(${p.description ?? null}, description),
      category = COALESCE(${p.category ?? null}, category),
      status = COALESCE(${p.status ?? null}, status),
      budget = COALESCE(${typeof p.budget === "number" ? p.budget : null}, budget),
      currency = COALESCE(${p.currency ?? null}, currency),
      address = COALESCE(${p.address ?? null}, address),
      city = COALESCE(${p.city ?? null}, city),
      country = COALESCE(${p.country ?? null}, country),
      tags = COALESCE(${p.tags ?? null}, tags),
      updated_at = now()
    WHERE id = ${id} AND seeker_id = ${seekerId}
    RETURNING id
  `;
  if (!rows[0]) return null;
  return getBountyById(id);
}

/** Delete a bounty if owned by seekerId; returns whether a row was deleted. */
export async function deleteBounty(id: string, seekerId: string): Promise<boolean> {
  await initBounties();
  const rows = await sql`
    DELETE FROM bounties
    WHERE id = ${id} AND seeker_id = ${seekerId}
    RETURNING id
  `;
  return Boolean(rows[0]);
}

// ─── Messaging tables & helpers ───────────────────────────────────────────────

export interface DbConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar_url: string | null;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  read: boolean;
  created_at: string;
}

export interface DbConversationSummary {
  id: string;
  bounty_id: string | null;
  bounty_title: string | null;
  participants: DbUser[];
  last_message: DbConversationMessage | null;
  unread_count: number;
  updated_at: string;
}

export async function initMessages() {
  await initDb();
  await initBounties();
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      bounty_id  TEXT REFERENCES bounties(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at    TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            TEXT NOT NULL DEFAULT 'TEXT',
      content         TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function getParticipants(conversationId: string): Promise<DbUser[]> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.password_hash, u.avatar_url, u.role, u.bio, u.city, u.country, u.country_code, u.created_at
    FROM conversation_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.conversation_id = ${conversationId}
    ORDER BY cp.created_at ASC
  `;
  return rows as DbUser[];
}

async function getLastMessage(conversationId: string, currentUserId: string): Promise<DbConversationMessage | null> {
  const rows = await sql`
    SELECT
      m.id, m.conversation_id, m.sender_id, m.type, m.content, m.created_at,
      s.name AS sender_name, s.avatar_url AS sender_avatar_url,
      CASE
        WHEN m.sender_id = ${currentUserId} THEN (
          SELECT COALESCE(other.last_read_at >= m.created_at, false)
          FROM conversation_participants other
          WHERE other.conversation_id = m.conversation_id
            AND other.user_id <> ${currentUserId}
          ORDER BY other.created_at ASC
          LIMIT 1
        )
        ELSE true
      END AS read
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    WHERE m.conversation_id = ${conversationId}
    ORDER BY m.created_at DESC
    LIMIT 1
  `;
  return (rows[0] as DbConversationMessage) ?? null;
}

async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM messages m
    JOIN conversation_participants cp
      ON cp.conversation_id = m.conversation_id
     AND cp.user_id = ${userId}
    WHERE m.conversation_id = ${conversationId}
      AND m.sender_id <> ${userId}
      AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
  `;
  return Number((rows[0] as { count: number })?.count ?? 0);
}

export async function getConversationsForUser(userId: string): Promise<DbConversationSummary[]> {
  await initMessages();
  const rows = await sql`
    SELECT c.id, c.bounty_id, b.title AS bounty_title, c.updated_at
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    LEFT JOIN bounties b ON b.id = c.bounty_id
    WHERE cp.user_id = ${userId}
    ORDER BY c.updated_at DESC
  `;

  const summaries = await Promise.all((rows as Array<{ id: string; bounty_id: string | null; bounty_title: string | null; updated_at: string }>).map(async (row) => {
    const [participants, last_message, unread_count] = await Promise.all([
      getParticipants(row.id),
      getLastMessage(row.id, userId),
      getUnreadCount(row.id, userId),
    ]);
    return {
      id: row.id,
      bounty_id: row.bounty_id,
      bounty_title: row.bounty_title,
      participants,
      last_message,
      unread_count,
      updated_at: row.updated_at,
    } satisfies DbConversationSummary;
  }));

  return summaries;
}

export async function getConversationForUser(conversationId: string, userId: string): Promise<DbConversationSummary | null> {
  await initMessages();
  const rows = await sql`
    SELECT c.id, c.bounty_id, b.title AS bounty_title, c.updated_at
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    LEFT JOIN bounties b ON b.id = c.bounty_id
    WHERE c.id = ${conversationId}
      AND cp.user_id = ${userId}
    LIMIT 1
  `;
  const row = rows[0] as { id: string; bounty_id: string | null; bounty_title: string | null; updated_at: string } | undefined;
  if (!row) return null;

  const [participants, last_message, unread_count] = await Promise.all([
    getParticipants(row.id),
    getLastMessage(row.id, userId),
    getUnreadCount(row.id, userId),
  ]);

  return {
    id: row.id,
    bounty_id: row.bounty_id,
    bounty_title: row.bounty_title,
    participants,
    last_message,
    unread_count,
    updated_at: row.updated_at,
  };
}

export async function listMessagesForConversation(conversationId: string, userId: string): Promise<DbConversationMessage[]> {
  await initMessages();
  const access = await sql`
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = ${conversationId}
      AND user_id = ${userId}
    LIMIT 1
  `;
  if (!access[0]) return [];

  const rows = await sql`
    SELECT
      m.id, m.conversation_id, m.sender_id, m.type, m.content, m.created_at,
      s.name AS sender_name, s.avatar_url AS sender_avatar_url,
      CASE
        WHEN m.sender_id = ${userId} THEN (
          SELECT COALESCE(other.last_read_at >= m.created_at, false)
          FROM conversation_participants other
          WHERE other.conversation_id = m.conversation_id
            AND other.user_id <> ${userId}
          ORDER BY other.created_at ASC
          LIMIT 1
        )
        ELSE true
      END AS read
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    WHERE m.conversation_id = ${conversationId}
    ORDER BY m.created_at ASC
  `;
  return rows as DbConversationMessage[];
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await initMessages();
  await sql`
    UPDATE conversation_participants
    SET last_read_at = now()
    WHERE conversation_id = ${conversationId}
      AND user_id = ${userId}
  `;
}

export async function sendConversationMessage(params: {
  conversationId: string;
  senderId: string;
  type?: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
}): Promise<DbConversationMessage | null> {
  await initMessages();
  const access = await sql`
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = ${params.conversationId}
      AND user_id = ${params.senderId}
    LIMIT 1
  `;
  if (!access[0]) return null;

  const inserted = await sql`
    INSERT INTO messages (conversation_id, sender_id, type, content)
    VALUES (${params.conversationId}, ${params.senderId}, ${params.type ?? "TEXT"}, ${params.content})
    RETURNING id
  `;
  await sql`
    UPDATE conversations
    SET updated_at = now()
    WHERE id = ${params.conversationId}
  `;
  const messageId = (inserted[0] as { id: string } | undefined)?.id;
  if (!messageId) return null;

  const rows = await sql`
    SELECT
      m.id, m.conversation_id, m.sender_id, m.type, m.content, m.created_at,
      s.name AS sender_name, s.avatar_url AS sender_avatar_url,
      true AS read
    FROM messages m
    JOIN users s ON s.id = m.sender_id
    WHERE m.id = ${messageId}
    LIMIT 1
  `;
  return (rows[0] as DbConversationMessage) ?? null;
}

export async function getOrCreateDirectConversation(params: {
  userId: string;
  otherUserId: string;
  bountyId?: string | null;
}): Promise<string> {
  await initMessages();
  if (params.userId === params.otherUserId) {
    throw new Error("Cannot create conversation with self");
  }

  const existing = await sql`
    SELECT c.id
    FROM conversations c
    JOIN conversation_participants p1
      ON p1.conversation_id = c.id AND p1.user_id = ${params.userId}
    JOIN conversation_participants p2
      ON p2.conversation_id = c.id AND p2.user_id = ${params.otherUserId}
    WHERE (${params.bountyId ?? null} IS NULL OR c.bounty_id = ${params.bountyId ?? null})
      AND (
        SELECT COUNT(*)
        FROM conversation_participants cp
        WHERE cp.conversation_id = c.id
      ) = 2
    ORDER BY c.updated_at DESC
    LIMIT 1
  `;

  const existingId = (existing[0] as { id: string } | undefined)?.id;
  if (existingId) return existingId;

  const created = await sql`
    INSERT INTO conversations (bounty_id)
    VALUES (${params.bountyId ?? null})
    RETURNING id
  `;
  const conversationId = (created[0] as { id: string } | undefined)?.id;
  if (!conversationId) {
    throw new Error("Failed to create conversation");
  }

  await sql`
    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
    VALUES
      (${conversationId}, ${params.userId}, now()),
      (${conversationId}, ${params.otherUserId}, now())
  `;

  return conversationId;
}
