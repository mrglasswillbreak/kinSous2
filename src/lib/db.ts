import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL environment variable is not set. See .env.local.example for setup instructions."
      );
    }
    _client = neon(process.env.DATABASE_URL);
  }
  return _client;
}

/** Tagged-template SQL helper (lazy, so imports remain safe at build time). */
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

export interface DbUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  password_hash?: string;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string;
}

export interface DbBounty {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: number | string;
  currency: string;
  seeker_id: string;
  address: string | null;
  city: string | null;
  country: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  seeker_name: string;
  seeker_avatar_url: string | null;
  seeker_city: string | null;
  seeker_country: string | null;
}

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

export interface DbConversation {
  id: string;
  user_one_id: string;
  user_two_id: string;
  bounty_id: string | null;
  bounty_title: string | null;
  participants: DbUser[];
  last_message: DbConversationMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBountyInput {
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

export interface UpdateBountyInput {
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

/**
 * Initialise the tables used by the app. Safe to call on every request.
 */
export async function initDb() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email         TEXT UNIQUE,
      phone         TEXT,
      name          TEXT NOT NULL,
      first_name    TEXT,
      last_name     TEXT,
      date_of_birth DATE,
      gender        TEXT,
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

  await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
    ON users (phone)
    WHERE phone IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bounties (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'OPEN',
      budget      NUMERIC NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'NGN',
      seeker_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      address     TEXT,
      city        TEXT,
      country     TEXT,
      tags        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_one_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_two_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bounty_id   TEXT REFERENCES bounties(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_direct_idx
    ON conversations (
      LEAST(user_one_id, user_two_id),
      GREATEST(user_one_id, user_two_id),
      COALESCE(bounty_id, '')
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            TEXT NOT NULL DEFAULT 'TEXT',
      content         TEXT NOT NULL,
      read            BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS conversation_messages_conversation_idx
    ON conversation_messages (conversation_id, created_at)
  `;
}

function normaliseNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getConversationRows(
  currentUserId: string,
  conversationId?: string
): Promise<DbConversation[]> {
  await initDb();

  const rows = await sql`
    SELECT
      c.id,
      c.user_one_id,
      c.user_two_id,
      c.bounty_id,
      b.title AS bounty_title,
      c.created_at::text AS created_at,
      c.updated_at::text AS updated_at
    FROM conversations c
    LEFT JOIN bounties b ON b.id = c.bounty_id
    WHERE (${conversationId ?? null}::text IS NULL OR c.id = ${conversationId ?? null})
      AND (c.user_one_id = ${currentUserId} OR c.user_two_id = ${currentUserId})
    ORDER BY c.updated_at DESC
  `;

  return Promise.all(
    rows.map(async (row) => {
      const participants = await sql`
        SELECT
          id,
          email,
          phone,
          name,
          first_name,
          last_name,
          date_of_birth::text AS date_of_birth,
          gender,
          avatar_url,
          role,
          bio,
          city,
          country,
          country_code,
          created_at::text AS created_at
        FROM users
        WHERE id IN (${row.user_one_id}, ${row.user_two_id})
        ORDER BY CASE WHEN id = ${currentUserId} THEN 0 ELSE 1 END
      `;

      const messages = await sql`
        SELECT
          m.id,
          m.conversation_id,
          m.sender_id,
          u.name AS sender_name,
          u.avatar_url AS sender_avatar_url,
          m.type,
          m.content,
          m.read,
          m.created_at::text AS created_at
        FROM conversation_messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${row.id}
        ORDER BY m.created_at DESC
        LIMIT 1
      `;

      const unreadRows = await sql`
        SELECT COUNT(*)::int AS count
        FROM conversation_messages
        WHERE conversation_id = ${row.id}
          AND sender_id != ${currentUserId}
          AND read = false
      `;

      return {
        ...row,
        participants: participants as DbUser[],
        last_message: (messages[0] as DbConversationMessage | undefined) ?? null,
        unread_count: Number(unreadRows[0]?.count ?? 0),
      } as DbConversation;
    })
  );
}

export async function getUserById(id: string): Promise<DbUser | null> {
  await initDb();

  const rows = await sql`
    SELECT
      id,
      email,
      phone,
      name,
      first_name,
      last_name,
      date_of_birth::text AS date_of_birth,
      gender,
      avatar_url,
      role,
      bio,
      city,
      country,
      country_code,
      created_at::text AS created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return (rows[0] as DbUser | undefined) ?? null;
}

export async function getHelpers(query?: string): Promise<DbUser[]> {
  await initDb();

  const search = query?.trim() ? `%${query.trim()}%` : null;
  const rows = await sql`
    SELECT
      id,
      email,
      phone,
      name,
      first_name,
      last_name,
      date_of_birth::text AS date_of_birth,
      gender,
      avatar_url,
      role,
      bio,
      city,
      country,
      country_code,
      created_at::text AS created_at
    FROM users
    WHERE role = 'HELPER'
      AND (
        ${search}::text IS NULL
        OR name ILIKE ${search}
        OR city ILIKE ${search}
        OR country ILIKE ${search}
        OR bio ILIKE ${search}
      )
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return rows as DbUser[];
}

export async function getBounties(filters: {
  category?: string;
  status?: string;
  query?: string;
  seekerId?: string;
} = {}): Promise<DbBounty[]> {
  await initDb();

  const category = normaliseNullable(filters.category);
  const status = normaliseNullable(filters.status);
  const seekerId = normaliseNullable(filters.seekerId);
  const search = filters.query?.trim() ? `%${filters.query.trim()}%` : null;

  const rows = await sql`
    SELECT
      b.id,
      b.title,
      b.description,
      b.category,
      b.status,
      b.budget,
      b.currency,
      b.seeker_id,
      b.address,
      b.city,
      b.country,
      COALESCE(b.tags, ARRAY[]::TEXT[]) AS tags,
      b.created_at::text AS created_at,
      b.updated_at::text AS updated_at,
      u.name AS seeker_name,
      u.avatar_url AS seeker_avatar_url,
      u.city AS seeker_city,
      u.country AS seeker_country
    FROM bounties b
    JOIN users u ON u.id = b.seeker_id
    WHERE (${category}::text IS NULL OR b.category = ${category})
      AND (${status}::text IS NULL OR b.status = ${status})
      AND (${seekerId}::text IS NULL OR b.seeker_id = ${seekerId})
      AND (
        ${search}::text IS NULL
        OR b.title ILIKE ${search}
        OR b.description ILIKE ${search}
        OR b.city ILIKE ${search}
      )
    ORDER BY b.created_at DESC
  `;

  return rows as DbBounty[];
}

export async function getBountyById(id: string): Promise<DbBounty | null> {
  await initDb();

  const rows = await sql`
    SELECT
      b.id,
      b.title,
      b.description,
      b.category,
      b.status,
      b.budget,
      b.currency,
      b.seeker_id,
      b.address,
      b.city,
      b.country,
      COALESCE(b.tags, ARRAY[]::TEXT[]) AS tags,
      b.created_at::text AS created_at,
      b.updated_at::text AS updated_at,
      u.name AS seeker_name,
      u.avatar_url AS seeker_avatar_url,
      u.city AS seeker_city,
      u.country AS seeker_country
    FROM bounties b
    JOIN users u ON u.id = b.seeker_id
    WHERE b.id = ${id}
    LIMIT 1
  `;

  return (rows[0] as DbBounty | undefined) ?? null;
}

export async function createBounty(input: CreateBountyInput): Promise<DbBounty> {
  await initDb();

  const rows = await sql`
    INSERT INTO bounties (
      title,
      description,
      category,
      budget,
      currency,
      seeker_id,
      address,
      city,
      country,
      tags
    )
    VALUES (
      ${input.title},
      ${input.description},
      ${input.category},
      ${input.budget},
      ${input.currency},
      ${input.seekerId},
      ${input.address},
      ${input.city},
      ${input.country},
      ${input.tags}
    )
    RETURNING id
  `;

  const bounty = await getBountyById(rows[0].id);
  if (!bounty) throw new Error("Created bounty could not be loaded");
  return bounty;
}

export async function updateBounty(
  id: string,
  seekerId: string,
  updates: UpdateBountyInput
): Promise<DbBounty | null> {
  await initDb();

  const existing = await getBountyById(id);
  if (!existing || existing.seeker_id !== seekerId) return null;

  await sql`
    UPDATE bounties
    SET
      title = ${updates.title ?? existing.title},
      description = ${updates.description ?? existing.description},
      category = ${updates.category ?? existing.category},
      status = ${updates.status ?? existing.status},
      budget = ${updates.budget ?? Number(existing.budget)},
      currency = ${updates.currency ?? existing.currency},
      address = ${updates.address ?? existing.address ?? null},
      city = ${updates.city ?? existing.city ?? null},
      country = ${updates.country ?? existing.country ?? null},
      tags = ${updates.tags ?? existing.tags ?? []},
      updated_at = now()
    WHERE id = ${id}
      AND seeker_id = ${seekerId}
  `;

  return getBountyById(id);
}

export async function deleteBounty(id: string, seekerId: string) {
  await initDb();

  const rows = await sql`
    DELETE FROM bounties
    WHERE id = ${id}
      AND seeker_id = ${seekerId}
    RETURNING id
  `;

  return rows.length > 0;
}

export async function getConversationsForUser(
  userId: string
): Promise<DbConversation[]> {
  return getConversationRows(userId);
}

export async function getConversationForUser(
  conversationId: string,
  userId: string
): Promise<DbConversation | null> {
  const rows = await getConversationRows(userId, conversationId);
  return rows[0] ?? null;
}

export async function getOrCreateDirectConversation(input: {
  userId: string;
  otherUserId: string;
  bountyId?: string | null;
}): Promise<string> {
  await initDb();

  const [userOneId, userTwoId] =
    input.userId < input.otherUserId
      ? [input.userId, input.otherUserId]
      : [input.otherUserId, input.userId];
  const bountyId = input.bountyId ?? null;

  const existing = await sql`
    SELECT id
    FROM conversations
    WHERE user_one_id = ${userOneId}
      AND user_two_id = ${userTwoId}
      AND COALESCE(bounty_id, '') = COALESCE(${bountyId}::text, '')
    LIMIT 1
  `;

  if (existing[0]?.id) return existing[0].id;

  const rows = await sql`
    INSERT INTO conversations (user_one_id, user_two_id, bounty_id)
    VALUES (${userOneId}, ${userTwoId}, ${bountyId})
    RETURNING id
  `;

  return rows[0].id;
}

export async function listMessagesForConversation(
  conversationId: string,
  userId: string
): Promise<DbConversationMessage[]> {
  await initDb();

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) return [];

  const rows = await sql`
    SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar_url,
      m.type,
      m.content,
      m.read,
      m.created_at::text AS created_at
    FROM conversation_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ${conversationId}
    ORDER BY m.created_at ASC
  `;

  return rows as DbConversationMessage[];
}

export async function markConversationRead(
  conversationId: string,
  userId: string
) {
  await initDb();

  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) return;

  await sql`
    UPDATE conversation_messages
    SET read = true
    WHERE conversation_id = ${conversationId}
      AND sender_id != ${userId}
  `;
}

export async function sendConversationMessage(input: {
  conversationId: string;
  senderId: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
}): Promise<DbConversationMessage | null> {
  await initDb();

  const conversation = await getConversationForUser(
    input.conversationId,
    input.senderId
  );
  if (!conversation) return null;

  const rows = await sql`
    INSERT INTO conversation_messages (
      conversation_id,
      sender_id,
      type,
      content,
      read
    )
    VALUES (
      ${input.conversationId},
      ${input.senderId},
      ${input.type},
      ${input.content},
      ${input.type === "SYSTEM"}
    )
    RETURNING id
  `;

  await sql`
    UPDATE conversations
    SET updated_at = now()
    WHERE id = ${input.conversationId}
  `;

  const messages = await sql`
    SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar_url,
      m.type,
      m.content,
      m.read,
      m.created_at::text AS created_at
    FROM conversation_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${rows[0].id}
    LIMIT 1
  `;

  return (messages[0] as DbConversationMessage | undefined) ?? null;
}
