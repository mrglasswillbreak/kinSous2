import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { mockBounties, mockHelpers, mockSeekers } from "@/lib/mock-data";

let _client: NeonQueryFunction<false, false> | null = null;

export function usingLocalDb() {
  return !process.env.DATABASE_URL;
}

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
  bids?: DbBid[];
}

export interface DbBid {
  id: string;
  bounty_id: string;
  helper_id: string;
  amount: number | string;
  currency: string;
  message: string;
  estimated_delivery_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
  helper_email: string | null;
  helper_phone: string | null;
  helper_name: string;
  helper_first_name: string | null;
  helper_last_name: string | null;
  helper_date_of_birth: string | null;
  helper_gender: string | null;
  helper_avatar_url: string | null;
  helper_role: string;
  helper_bio: string | null;
  helper_city: string | null;
  helper_country: string | null;
  helper_country_code: string | null;
  helper_created_at: string;
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

export interface CreateBidInput {
  bountyId: string;
  helperId: string;
  amount: number;
  message: string;
  estimatedDeliveryMinutes: number;
}

interface LocalStore {
  users: DbUser[];
  bounties: Array<Omit<DbBounty, "seeker_name" | "seeker_avatar_url" | "seeker_city" | "seeker_country" | "bids">>;
  bids: DbBid[];
  conversations: Array<{
    id: string;
    user_one_id: string;
    user_two_id: string;
    bounty_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  conversation_messages: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    type: "TEXT" | "IMAGE" | "SYSTEM";
    content: string;
    read: boolean;
    created_at: string;
  }>;
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".kinsous-local-db.json");
let localStoreCache: LocalStore | null = null;

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function localProfileToUser(profile: (typeof mockHelpers)[number], passwordHash = ""): DbUser {
  return {
    id: profile.id,
    email: profile.id === "seeker-1" ? "chioma@kinsous.com" : null,
    phone: null,
    name: profile.name,
    first_name: profile.firstName ?? profile.name.split(" ")[0] ?? null,
    last_name: profile.lastName ?? (profile.name.split(" ").slice(1).join(" ") || null),
    date_of_birth: profile.dateOfBirth ?? null,
    gender: profile.gender ?? null,
    password_hash: passwordHash,
    avatar_url: profile.avatarUrl,
    role: profile.role,
    bio: profile.bio ?? null,
    city: profile.location.city,
    country: profile.location.country,
    country_code: profile.location.countryCode,
    created_at: profile.createdAt,
  };
}

function localBountyBase(
  bounty: (typeof mockBounties)[number]
): LocalStore["bounties"][number] {
  return {
    id: bounty.id,
    title: bounty.title,
    description: bounty.description,
    category: bounty.category,
    status: bounty.status,
    budget: bounty.budget,
    currency: bounty.currency,
    seeker_id: bounty.seeker.id,
    address: bounty.location.address,
    city: bounty.location.city,
    country: bounty.location.country,
    tags: bounty.tags,
    created_at: bounty.createdAt,
    updated_at: bounty.updatedAt,
  };
}

function localBidFromAppBid(
  bid: NonNullable<(typeof mockBounties)[number]["bids"]>[number]
): DbBid {
  const helper = bid.helper;
  return {
    id: bid.id,
    bounty_id: bid.bountyId,
    helper_id: helper.id,
    amount: bid.amount,
    currency: bid.currency,
    message: bid.message,
    estimated_delivery_minutes: bid.estimatedDeliveryMinutes,
    status: bid.status,
    created_at: bid.createdAt,
    updated_at: bid.createdAt,
    helper_email: helper.email ?? null,
    helper_phone: helper.phone ?? null,
    helper_name: helper.name,
    helper_first_name: helper.firstName ?? helper.name.split(" ")[0] ?? null,
    helper_last_name: helper.lastName ?? (helper.name.split(" ").slice(1).join(" ") || null),
    helper_date_of_birth: helper.dateOfBirth ?? null,
    helper_gender: helper.gender ?? null,
    helper_avatar_url: helper.avatarUrl,
    helper_role: helper.role,
    helper_bio: helper.bio ?? null,
    helper_city: helper.location.city,
    helper_country: helper.location.country,
    helper_country_code: helper.location.countryCode,
    helper_created_at: helper.createdAt,
  };
}

function makeSeedStore(): LocalStore {
  const users = [
    ...mockSeekers.map((p) => localProfileToUser(p)),
    ...mockHelpers.map((p) => localProfileToUser(p)),
  ];

  users.push({
    id: "helper-demo",
    email: "amara@kinsous.com",
    phone: null,
    name: "Amara Demo",
    first_name: "Amara",
    last_name: "Demo",
    date_of_birth: null,
    gender: null,
    password_hash: "",
    avatar_url: "https://i.pravatar.cc/150?img=47",
    role: "HELPER",
    bio: "Demo helper account for testing bids.",
    city: "Lagos",
    country: "Nigeria",
    country_code: "NG",
    created_at: new Date().toISOString(),
  });

  const bids = mockBounties.flatMap((bounty) => bounty.bids ?? []).map(localBidFromAppBid);
  return {
    users: Array.from(new Map(users.map((user) => [user.id, user])).values()),
    bounties: mockBounties.map(localBountyBase),
    bids,
    conversations: [],
    conversation_messages: [],
  };
}

async function readLocalStore(): Promise<LocalStore> {
  if (localStoreCache) return localStoreCache;
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    localStoreCache = JSON.parse(raw) as LocalStore;
  } catch {
    localStoreCache = makeSeedStore();
    await writeLocalStore(localStoreCache);
  }
  return localStoreCache;
}

async function writeLocalStore(store: LocalStore) {
  localStoreCache = store;
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
}

function localJoinBounty(store: LocalStore, bounty: LocalStore["bounties"][number]): DbBounty {
  const seeker = store.users.find((user) => user.id === bounty.seeker_id);
  return {
    ...bounty,
    seeker_name: seeker?.name ?? "Unknown poster",
    seeker_avatar_url: seeker?.avatar_url ?? null,
    seeker_city: seeker?.city ?? null,
    seeker_country: seeker?.country ?? null,
    bids: store.bids
      .filter((bid) => bid.bounty_id === bounty.id)
      .sort((a, b) => {
        const rank = (status: string) => (status === "ACCEPTED" ? 0 : status === "PENDING" ? 1 : 2);
        return rank(a.status) - rank(b.status) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
  };
}

function localBidWithHelper(store: LocalStore, bid: DbBid): DbBid {
  const helper = store.users.find((user) => user.id === bid.helper_id);
  if (!helper) return bid;
  return {
    ...bid,
    helper_email: helper.email,
    helper_phone: helper.phone,
    helper_name: helper.name,
    helper_first_name: helper.first_name,
    helper_last_name: helper.last_name,
    helper_date_of_birth: helper.date_of_birth,
    helper_gender: helper.gender,
    helper_avatar_url: helper.avatar_url,
    helper_role: helper.role,
    helper_bio: helper.bio,
    helper_city: helper.city,
    helper_country: helper.country,
    helper_country_code: helper.country_code,
    helper_created_at: helper.created_at,
  };
}

export async function upsertLocalUser(user: DbUser) {
  const store = await readLocalStore();
  const index = store.users.findIndex((existing) => existing.id === user.id);
  if (index >= 0) store.users[index] = { ...store.users[index], ...user };
  else store.users.push(user);
  await writeLocalStore(store);
  return user;
}

export async function findLocalUserByIdentifier(identifier: string): Promise<DbUser | null> {
  const store = await readLocalStore();
  const normalized = identifier.trim().toLowerCase();
  return (
    store.users.find(
      (user) =>
        user.email?.toLowerCase() === normalized ||
        user.phone === identifier.trim()
    ) ?? null
  );
}

/**
 * Initialise the tables used by the app. Safe to call on every request.
 */
export async function initDb() {
  if (usingLocalDb()) {
    await readLocalStore();
    return;
  }

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

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'SEEKER'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
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

  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS title TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS category TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN'`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS budget NUMERIC`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN'`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS seeker_id TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS address TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS city TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS country TEXT`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[]`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
  await sql`ALTER TABLE bounties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`;

  await sql`
    CREATE TABLE IF NOT EXISTS bids (
      id                         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      bounty_id                  TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
      helper_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount                     NUMERIC NOT NULL,
      currency                   TEXT NOT NULL DEFAULT 'NGN',
      message                    TEXT NOT NULL,
      estimated_delivery_minutes INTEGER NOT NULL DEFAULT 60,
      status                     TEXT NOT NULL DEFAULT 'PENDING',
      created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS bounty_id TEXT`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS helper_id TEXT`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS amount NUMERIC`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN'`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS message TEXT`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS estimated_delivery_minutes INTEGER DEFAULT 60`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING'`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
  await sql`ALTER TABLE bids ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`;

  await sql`
    CREATE INDEX IF NOT EXISTS bids_bounty_created_idx
    ON bids (bounty_id, created_at DESC)
    WHERE bounty_id IS NOT NULL
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS bids_open_helper_unique_idx
    ON bids (bounty_id, helper_id)
    WHERE status IN ('PENDING', 'ACCEPTED')
      AND bounty_id IS NOT NULL
      AND helper_id IS NOT NULL
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

  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text`;
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_one_id TEXT`;
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_two_id TEXT`;
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bounty_id TEXT`;
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
  await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`;

  await sql`
    CREATE INDEX IF NOT EXISTS conversations_direct_lookup_idx
    ON conversations (
      LEAST(user_one_id, user_two_id),
      GREATEST(user_one_id, user_two_id),
      COALESCE(bounty_id, '')
    )
    WHERE user_one_id IS NOT NULL
      AND user_two_id IS NOT NULL
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

  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS conversation_id TEXT`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS sender_id TEXT`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'TEXT'`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS content TEXT`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;

  await sql`
    CREATE INDEX IF NOT EXISTS conversation_messages_conversation_idx
    ON conversation_messages (conversation_id, created_at)
  `;
}

function normaliseNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getBidsForBountyIds(bountyIds: string[]): Promise<DbBid[]> {
  if (bountyIds.length === 0) return [];
  await initDb();

  const rows = await sql`
    SELECT
      bid.id,
      bid.bounty_id,
      bid.helper_id,
      bid.amount,
      bid.currency,
      bid.message,
      bid.estimated_delivery_minutes,
      bid.status,
      bid.created_at::text AS created_at,
      bid.updated_at::text AS updated_at,
      u.email AS helper_email,
      u.phone AS helper_phone,
      u.name AS helper_name,
      u.first_name AS helper_first_name,
      u.last_name AS helper_last_name,
      u.date_of_birth::text AS helper_date_of_birth,
      u.gender AS helper_gender,
      u.avatar_url AS helper_avatar_url,
      u.role AS helper_role,
      u.bio AS helper_bio,
      u.city AS helper_city,
      u.country AS helper_country,
      u.country_code AS helper_country_code,
      u.created_at::text AS helper_created_at
    FROM bids bid
    JOIN users u ON u.id = bid.helper_id
    WHERE bid.bounty_id = ANY(${bountyIds})
    ORDER BY
      CASE bid.status WHEN 'ACCEPTED' THEN 0 WHEN 'PENDING' THEN 1 ELSE 2 END,
      bid.created_at DESC
  `;

  return rows as DbBid[];
}

async function attachBidsToBounties<T extends DbBounty>(bounties: T[]): Promise<T[]> {
  const bids = await getBidsForBountyIds(bounties.map((b) => b.id));
  return bounties.map((bounty) => ({
    ...bounty,
    bids: bids.filter((bid) => bid.bounty_id === bounty.id),
  }));
}

function localConversationToDb(
  store: LocalStore,
  currentUserId: string,
  conversation: LocalStore["conversations"][number]
): DbConversation {
  const participants = [conversation.user_one_id, conversation.user_two_id]
    .map((id) => store.users.find((user) => user.id === id))
    .filter(Boolean) as DbUser[];
  participants.sort((a) => (a.id === currentUserId ? -1 : 1));
  const messages = store.conversation_messages
    .filter((message) => message.conversation_id === conversation.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const last = messages[0];
  const sender = last ? store.users.find((user) => user.id === last.sender_id) : null;
  const bounty = conversation.bounty_id
    ? store.bounties.find((candidate) => candidate.id === conversation.bounty_id)
    : null;

  return {
    id: conversation.id,
    user_one_id: conversation.user_one_id,
    user_two_id: conversation.user_two_id,
    bounty_id: conversation.bounty_id,
    bounty_title: bounty?.title ?? null,
    participants,
    last_message: last
      ? {
          id: last.id,
          conversation_id: last.conversation_id,
          sender_id: last.sender_id,
          sender_name: sender?.name ?? "KinSous",
          sender_avatar_url: sender?.avatar_url ?? null,
          type: last.type,
          content: last.content,
          read: last.read,
          created_at: last.created_at,
        }
      : null,
    unread_count: store.conversation_messages.filter(
      (message) =>
        message.conversation_id === conversation.id &&
        message.sender_id !== currentUserId &&
        !message.read
    ).length,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
  };
}

async function getLocalConversationRows(
  currentUserId: string,
  conversationId?: string
): Promise<DbConversation[]> {
  const store = await readLocalStore();
  return store.conversations
    .filter((conversation) =>
      conversationId ? conversation.id === conversationId : true
    )
    .filter(
      (conversation) =>
        conversation.user_one_id === currentUserId ||
        conversation.user_two_id === currentUserId
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((conversation) => localConversationToDb(store, currentUserId, conversation));
}

async function getConversationRows(
  currentUserId: string,
  conversationId?: string
): Promise<DbConversation[]> {
  await initDb();
  if (usingLocalDb()) {
    return getLocalConversationRows(currentUserId, conversationId);
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.users.find((user) => user.id === id) ?? null;
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const search = query?.trim().toLowerCase();
    return store.users
      .filter((user) => user.role === "HELPER")
      .filter((user) => {
        if (!search) return true;
        return [user.name, user.city, user.country, user.bio]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const category = normaliseNullable(filters.category);
    const status = normaliseNullable(filters.status);
    const seekerId = normaliseNullable(filters.seekerId);
    const search = filters.query?.trim().toLowerCase();
    return store.bounties
      .filter((bounty) => !category || bounty.category === category)
      .filter((bounty) => !status || bounty.status === status)
      .filter((bounty) => !seekerId || bounty.seeker_id === seekerId)
      .filter((bounty) => {
        if (!search) return true;
        return [bounty.title, bounty.description, bounty.city]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((bounty) => localJoinBounty(store, bounty));
  }

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

  return attachBidsToBounties(rows as DbBounty[]);
}

export async function getBountyById(id: string): Promise<DbBounty | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === id);
    return bounty ? localJoinBounty(store, bounty) : null;
  }

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

  const bounties = await attachBidsToBounties(rows as DbBounty[]);
  return bounties[0] ?? null;
}

export async function createBounty(input: CreateBountyInput): Promise<DbBounty> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const now = new Date().toISOString();
    const bounty: LocalStore["bounties"][number] = {
      id: uid("bounty"),
      title: input.title,
      description: input.description,
      category: input.category,
      status: "OPEN",
      budget: input.budget,
      currency: input.currency,
      seeker_id: input.seekerId,
      address: input.address,
      city: input.city,
      country: input.country,
      tags: input.tags,
      created_at: now,
      updated_at: now,
    };
    store.bounties.unshift(bounty);
    await writeLocalStore(store);
    return localJoinBounty(store, bounty);
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const index = store.bounties.findIndex((bounty) => bounty.id === id);
    const existing = index >= 0 ? store.bounties[index] : null;
    if (!existing || existing.seeker_id !== seekerId) return null;
    const updated = {
      ...existing,
      title: updates.title ?? existing.title,
      description: updates.description ?? existing.description,
      category: updates.category ?? existing.category,
      status: updates.status ?? existing.status,
      budget: updates.budget ?? existing.budget,
      currency: updates.currency ?? existing.currency,
      address: updates.address ?? existing.address,
      city: updates.city ?? existing.city,
      country: updates.country ?? existing.country,
      tags: updates.tags ?? existing.tags,
      updated_at: new Date().toISOString(),
    };
    store.bounties[index] = updated;
    await writeLocalStore(store);
    return localJoinBounty(store, updated);
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const originalLength = store.bounties.length;
    store.bounties = store.bounties.filter(
      (bounty) => !(bounty.id === id && bounty.seeker_id === seekerId)
    );
    if (store.bounties.length === originalLength) return false;
    store.bids = store.bids.filter((bid) => bid.bounty_id !== id);
    await writeLocalStore(store);
    return true;
  }

  const rows = await sql`
    DELETE FROM bounties
    WHERE id = ${id}
      AND seeker_id = ${seekerId}
    RETURNING id
  `;

  return rows.length > 0;
}

export async function getBidById(id: string): Promise<DbBid | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bid = store.bids.find((candidate) => candidate.id === id);
    return bid ? localBidWithHelper(store, bid) : null;
  }

  const rows = await sql`
    SELECT
      bid.id,
      bid.bounty_id,
      bid.helper_id,
      bid.amount,
      bid.currency,
      bid.message,
      bid.estimated_delivery_minutes,
      bid.status,
      bid.created_at::text AS created_at,
      bid.updated_at::text AS updated_at,
      u.email AS helper_email,
      u.phone AS helper_phone,
      u.name AS helper_name,
      u.first_name AS helper_first_name,
      u.last_name AS helper_last_name,
      u.date_of_birth::text AS helper_date_of_birth,
      u.gender AS helper_gender,
      u.avatar_url AS helper_avatar_url,
      u.role AS helper_role,
      u.bio AS helper_bio,
      u.city AS helper_city,
      u.country AS helper_country,
      u.country_code AS helper_country_code,
      u.created_at::text AS helper_created_at
    FROM bids bid
    JOIN users u ON u.id = bid.helper_id
    WHERE bid.id = ${id}
    LIMIT 1
  `;

  return (rows[0] as DbBid | undefined) ?? null;
}

export async function createBid(input: CreateBidInput): Promise<DbBid | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    const helper = store.users.find((user) => user.id === input.helperId);
    if (!bounty || !helper || helper.role !== "HELPER" || bounty.status !== "OPEN" || bounty.seeker_id === input.helperId) {
      return null;
    }
    const existing = store.bids.find(
      (bid) =>
        bid.bounty_id === input.bountyId &&
        bid.helper_id === input.helperId &&
        ["PENDING", "ACCEPTED"].includes(bid.status)
    );
    const now = new Date().toISOString();
    if (existing) {
      if (existing.status === "ACCEPTED") return localBidWithHelper(store, existing);
      existing.amount = input.amount;
      existing.currency = bounty.currency;
      existing.message = input.message;
      existing.estimated_delivery_minutes = input.estimatedDeliveryMinutes;
      existing.updated_at = now;
      bounty.updated_at = now;
      await writeLocalStore(store);
      return localBidWithHelper(store, existing);
    }

    const bid: DbBid = localBidWithHelper(store, {
      id: uid("bid"),
      bounty_id: input.bountyId,
      helper_id: input.helperId,
      amount: input.amount,
      currency: bounty.currency,
      message: input.message,
      estimated_delivery_minutes: input.estimatedDeliveryMinutes,
      status: "PENDING",
      created_at: now,
      updated_at: now,
      helper_email: helper.email,
      helper_phone: helper.phone,
      helper_name: helper.name,
      helper_first_name: helper.first_name,
      helper_last_name: helper.last_name,
      helper_date_of_birth: helper.date_of_birth,
      helper_gender: helper.gender,
      helper_avatar_url: helper.avatar_url,
      helper_role: helper.role,
      helper_bio: helper.bio,
      helper_city: helper.city,
      helper_country: helper.country,
      helper_country_code: helper.country_code,
      helper_created_at: helper.created_at,
    });
    store.bids.push(bid);
    bounty.updated_at = now;
    await writeLocalStore(store);
    return bid;
  }

  const bounty = await getBountyById(input.bountyId);
  if (!bounty || bounty.status !== "OPEN" || bounty.seeker_id === input.helperId) {
    return null;
  }

  const existing = await sql`
    SELECT id, status
    FROM bids
    WHERE bounty_id = ${input.bountyId}
      AND helper_id = ${input.helperId}
      AND status IN ('PENDING', 'ACCEPTED')
    LIMIT 1
  `;

  if (existing[0]?.status === "ACCEPTED") {
    return getBidById(existing[0].id);
  }

  if (existing[0]?.id) {
    await sql`
      UPDATE bids
      SET
        amount = ${input.amount},
        currency = ${bounty.currency},
        message = ${input.message},
        estimated_delivery_minutes = ${input.estimatedDeliveryMinutes},
        updated_at = now()
      WHERE id = ${existing[0].id}
    `;
    return getBidById(existing[0].id);
  }

  const rows = await sql`
    INSERT INTO bids (
      bounty_id,
      helper_id,
      amount,
      currency,
      message,
      estimated_delivery_minutes
    )
    VALUES (
      ${input.bountyId},
      ${input.helperId},
      ${input.amount},
      ${bounty.currency},
      ${input.message},
      ${input.estimatedDeliveryMinutes}
    )
    RETURNING id
  `;

  await sql`
    UPDATE bounties
    SET updated_at = now()
    WHERE id = ${input.bountyId}
  `;

  return getBidById(rows[0].id);
}

export async function acceptBid(input: {
  bountyId: string;
  bidId: string;
  seekerId: string;
}): Promise<DbBid | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    const bid = store.bids.find((candidate) => candidate.id === input.bidId);
    if (!bounty || bounty.seeker_id !== input.seekerId || bounty.status !== "OPEN") return null;
    if (!bid || bid.bounty_id !== input.bountyId || bid.status !== "PENDING") return null;
    const now = new Date().toISOString();
    store.bids.forEach((candidate) => {
      if (candidate.bounty_id === input.bountyId && candidate.status === "PENDING") {
        candidate.status = candidate.id === input.bidId ? "ACCEPTED" : "REJECTED";
        candidate.updated_at = now;
      }
    });
    bounty.status = "IN_PROGRESS";
    bounty.updated_at = now;
    await writeLocalStore(store);
    return localBidWithHelper(store, bid);
  }

  const bounty = await getBountyById(input.bountyId);
  if (!bounty || bounty.seeker_id !== input.seekerId || bounty.status !== "OPEN") {
    return null;
  }

  const bid = await getBidById(input.bidId);
  if (!bid || bid.bounty_id !== input.bountyId || bid.status !== "PENDING") {
    return null;
  }

  await sql`
    UPDATE bids
    SET status = 'REJECTED', updated_at = now()
    WHERE bounty_id = ${input.bountyId}
      AND id != ${input.bidId}
      AND status = 'PENDING'
  `;

  await sql`
    UPDATE bids
    SET status = 'ACCEPTED', updated_at = now()
    WHERE id = ${input.bidId}
      AND bounty_id = ${input.bountyId}
  `;

  await sql`
    UPDATE bounties
    SET status = 'IN_PROGRESS', updated_at = now()
    WHERE id = ${input.bountyId}
      AND seeker_id = ${input.seekerId}
  `;

  return getBidById(input.bidId);
}

export async function canContactAcceptedBidder(input: {
  bountyId: string;
  seekerId: string;
  helperId: string;
}) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    if (!bounty || bounty.seeker_id !== input.seekerId) return false;
    return store.bids.some(
      (bid) =>
        bid.bounty_id === input.bountyId &&
        bid.helper_id === input.helperId &&
        bid.status === "ACCEPTED"
    );
  }

  const bounty = await getBountyById(input.bountyId);
  if (!bounty || bounty.seeker_id !== input.seekerId) return false;

  const rows = await sql`
    SELECT id
    FROM bids
    WHERE bounty_id = ${input.bountyId}
      AND helper_id = ${input.helperId}
      AND status = 'ACCEPTED'
    LIMIT 1
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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const [userOneId, userTwoId] =
      input.userId < input.otherUserId
        ? [input.userId, input.otherUserId]
        : [input.otherUserId, input.userId];
    const bountyId = input.bountyId ?? null;
    const existing = store.conversations.find(
      (conversation) =>
        conversation.user_one_id === userOneId &&
        conversation.user_two_id === userTwoId &&
        (conversation.bounty_id ?? null) === bountyId
    );
    if (existing) return existing.id;
    const now = new Date().toISOString();
    const conversation = {
      id: uid("conv"),
      user_one_id: userOneId,
      user_two_id: userTwoId,
      bounty_id: bountyId,
      created_at: now,
      updated_at: now,
    };
    store.conversations.unshift(conversation);
    await writeLocalStore(store);
    return conversation.id;
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const conversation = await getConversationForUser(conversationId, userId);
    if (!conversation) return [];
    return store.conversation_messages
      .filter((message) => message.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((message) => {
        const sender = store.users.find((user) => user.id === message.sender_id);
        return {
          ...message,
          sender_name: sender?.name ?? "KinSous",
          sender_avatar_url: sender?.avatar_url ?? null,
        };
      });
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const conversation = await getConversationForUser(conversationId, userId);
    if (!conversation) return;
    store.conversation_messages.forEach((message) => {
      if (message.conversation_id === conversationId && message.sender_id !== userId) {
        message.read = true;
      }
    });
    await writeLocalStore(store);
    return;
  }

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
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const conversation = store.conversations.find(
      (candidate) =>
        candidate.id === input.conversationId &&
        (candidate.user_one_id === input.senderId || candidate.user_two_id === input.senderId)
    );
    if (!conversation) return null;
    const now = new Date().toISOString();
    const message = {
      id: uid("msg"),
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      type: input.type,
      content: input.content,
      read: input.type === "SYSTEM",
      created_at: now,
    };
    store.conversation_messages.push(message);
    conversation.updated_at = now;
    await writeLocalStore(store);
    const sender = store.users.find((user) => user.id === input.senderId);
    return {
      ...message,
      sender_name: sender?.name ?? "KinSous",
      sender_avatar_url: sender?.avatar_url ?? null,
    };
  }

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
