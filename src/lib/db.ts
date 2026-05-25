import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { mockBounties, mockHelpers, mockReviews, mockSeekers } from "@/lib/mock-data";

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
  completed_orders?: number;
  average_rating?: number | string | null;
  rating_percentage?: number | string | null;
  total_reviews?: number;
  total_earnings?: number | string;
  earnings_currency?: string | null;
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
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
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
  blocked_by_me?: boolean;
  blocked_by_other?: boolean;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  avatar_url: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export interface DbReview {
  id: string;
  bounty_id: string;
  author_id: string;
  target_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
}

export interface DbHelperInteractionHistoryRow {
  bounty_id: string;
  bounty_title: string;
  bounty_status: string;
  city: string | null;
  country: string | null;
  accepted_amount: number | string;
  currency: string;
  interacted_at: string;
  review_id: string | null;
  review_rating: number | null;
  review_comment: string | null;
  review_created_at: string | null;
}

export interface DbUserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface DbUserPresence {
  user_id: string;
  status: string;
  last_seen: string;
  updated_at: string;
}

export interface DbConversationTyping {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

export interface DbPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
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
    edited_at?: string | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
  }>;
  conversation_deletions: Array<{
    conversation_id: string;
    user_id: string;
    deleted_at: string;
  }>;
  user_blocks: Array<{
    id: string;
    blocker_id: string;
    blocked_id: string;
    created_at: string;
  }>;
  notifications: Array<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    avatar_url: string | null;
    href: string | null;
    read: boolean;
    created_at: string;
  }>;
  reviews: Array<{
    id: string;
    bounty_id: string;
    author_id: string;
    target_id: string;
    rating: number;
    comment: string;
    created_at: string;
    updated_at: string;
  }>;
  user_presence: Array<{
    user_id: string;
    status: string;
    last_seen: string;
    updated_at: string;
  }>;
  conversation_typing: Array<{
    conversation_id: string;
    user_id: string;
    is_typing: boolean;
    updated_at: string;
  }>;
  push_subscriptions: Array<{
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    created_at: string;
    updated_at: string;
  }>;
  message_reports: Array<{
    id: string;
    conversation_id: string;
    reporter_id: string;
    reported_user_id: string;
    message_id: string | null;
    reason: string;
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
  const reviews = mockReviews.map((review) => ({
    id: review.id,
    bounty_id: review.bountyId,
    author_id: review.authorId,
    target_id: review.targetId,
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt,
    updated_at: review.createdAt,
  }));
  return {
    users: Array.from(new Map(users.map((user) => [user.id, user])).values()),
    bounties: mockBounties.map(localBountyBase),
    bids,
    conversations: [],
    conversation_messages: [],
    conversation_deletions: [],
    user_blocks: [],
    notifications: [],
    reviews,
    user_presence: [],
    conversation_typing: [],
    push_subscriptions: [],
    message_reports: [],
  };
}

async function readLocalStore(): Promise<LocalStore> {
  if (localStoreCache) return localStoreCache;
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStore;
    parsed.conversation_deletions ??= [];
    parsed.user_blocks ??= [];
    parsed.notifications ??= [];
    parsed.reviews ??= [];
    parsed.user_presence ??= [];
    parsed.conversation_typing ??= [];
    parsed.push_subscriptions ??= [];
    parsed.message_reports ??= [];
    localStoreCache = parsed;
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

function localGetAcceptedBid(
  store: LocalStore,
  bountyId: string
): DbBid | null {
  const acceptedBid = store.bids.find(
    (candidate) => candidate.bounty_id === bountyId && candidate.status === "ACCEPTED"
  );
  return acceptedBid ? localBidWithHelper(store, acceptedBid) : null;
}

function localWithHelperMetrics(store: LocalStore, user: DbUser): DbUser {
  if (user.role !== "HELPER") return user;
  const completedAcceptedBids = store.bids.filter((bid) => {
    if (bid.helper_id !== user.id || bid.status !== "ACCEPTED") return false;
    const bounty = store.bounties.find((candidate) => candidate.id === bid.bounty_id);
    return bounty?.status === "COMPLETED";
  });
  const helperReviews = store.reviews.filter((review) => review.target_id === user.id);
  const totalReviews = helperReviews.length;
  const averageRating = totalReviews
    ? helperReviews.reduce((sum, review) => sum + Number(review.rating), 0) / totalReviews
    : 0;
  const ratingPercentage = averageRating > 0 ? (averageRating / 5) * 100 : 0;
  const totalEarnings = completedAcceptedBids.reduce(
    (sum, bid) => sum + Number(bid.amount),
    0
  );

  return {
    ...user,
    completed_orders: completedAcceptedBids.length,
    average_rating: averageRating,
    rating_percentage: ratingPercentage,
    total_reviews: totalReviews,
    total_earnings: totalEarnings,
    earnings_currency: completedAcceptedBids[0]?.currency ?? "NGN",
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
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
  await sql`ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS deleted_by TEXT`;

  await sql`
    CREATE INDEX IF NOT EXISTS conversation_messages_conversation_idx
    ON conversation_messages (conversation_id, created_at)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversation_deletions (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deleted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_blocks (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (blocker_id, blocked_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT NOT NULL,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      avatar_url TEXT,
      href       TEXT,
      read       BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      bounty_id  TEXT NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
      author_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment    TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (bounty_id, author_id)
    )
  `;

  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS bounty_id TEXT`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_id TEXT`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS target_id TEXT`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment TEXT`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`;
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_bounty_author_unique_idx
    ON reviews (bounty_id, author_id)
    WHERE bounty_id IS NOT NULL
      AND author_id IS NOT NULL
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS reviews_target_created_idx
    ON reviews (target_id, created_at DESC)
    WHERE target_id IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      status     TEXT NOT NULL DEFAULT 'OFFLINE',
      last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS conversation_typing (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_typing       BOOLEAN NOT NULL DEFAULT false,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, endpoint)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS message_reports (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      reporter_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message_id       TEXT,
      reason           TEXT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )
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
          content: last.deleted_at ? "Message deleted" : last.content,
          read: last.read,
          created_at: last.created_at,
          edited_at: last.edited_at ?? null,
          deleted_at: last.deleted_at ?? null,
          deleted_by: last.deleted_by ?? null,
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
  const deleted = new Set(
    store.conversation_deletions
      .filter((entry) => entry.user_id === currentUserId)
      .map((entry) => entry.conversation_id)
  );
  const blockedByMe = new Set(
    store.user_blocks
      .filter((entry) => entry.blocker_id === currentUserId)
      .map((entry) => entry.blocked_id)
  );
  const blockedByOther = new Set(
    store.user_blocks
      .filter((entry) => entry.blocked_id === currentUserId)
      .map((entry) => entry.blocker_id)
  );
  return store.conversations
    .filter((conversation) =>
      conversationId ? conversation.id === conversationId : true
    )
    .filter((conversation) => !deleted.has(conversation.id))
    .filter(
      (conversation) =>
        conversation.user_one_id === currentUserId ||
        conversation.user_two_id === currentUserId
    )
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .map((conversation) => {
      const row = localConversationToDb(store, currentUserId, conversation);
      const otherId = conversation.user_one_id === currentUserId ? conversation.user_two_id : conversation.user_one_id;
      return {
        ...row,
        blocked_by_me: blockedByMe.has(otherId),
        blocked_by_other: blockedByOther.has(otherId),
      };
    });
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
    LEFT JOIN conversation_deletions cd
      ON cd.conversation_id = c.id
     AND cd.user_id = ${currentUserId}
    WHERE (${conversationId ?? null}::text IS NULL OR c.id = ${conversationId ?? null})
      AND (c.user_one_id = ${currentUserId} OR c.user_two_id = ${currentUserId})
      AND cd.conversation_id IS NULL
    ORDER BY c.updated_at DESC
  `;

  const blockedByMeRows = await sql`
    SELECT blocked_id
    FROM user_blocks
    WHERE blocker_id = ${currentUserId}
  `;
  const blockedByOtherRows = await sql`
    SELECT blocker_id
    FROM user_blocks
    WHERE blocked_id = ${currentUserId}
  `;
  const blockedByMe = new Set((blockedByMeRows as { blocked_id: string }[]).map((r) => r.blocked_id));
  const blockedByOther = new Set((blockedByOtherRows as { blocker_id: string }[]).map((r) => r.blocker_id));

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
          CASE WHEN m.deleted_at IS NOT NULL THEN 'Message deleted' ELSE m.content END AS content,
          m.read,
          m.edited_at::text AS edited_at,
          m.deleted_at::text AS deleted_at,
          m.deleted_by,
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
        blocked_by_me: blockedByMe.has(
          row.user_one_id === currentUserId ? row.user_two_id : row.user_one_id
        ),
        blocked_by_other: blockedByOther.has(
          row.user_one_id === currentUserId ? row.user_two_id : row.user_one_id
        ),
      } as DbConversation;
    })
  );
}

export async function getUserById(id: string): Promise<DbUser | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const user = store.users.find((candidate) => candidate.id === id);
    return user ? localWithHelperMetrics(store, user) : null;
  }

  const rows = await sql`
    SELECT
      u.id,
      u.email,
      u.phone,
      u.name,
      u.first_name,
      u.last_name,
      u.date_of_birth::text AS date_of_birth,
      u.gender,
      u.avatar_url,
      u.role,
      u.bio,
      u.city,
      u.country,
      u.country_code,
      COALESCE(completed.completed_orders, 0) AS completed_orders,
      reviews.average_rating,
      reviews.rating_percentage,
      COALESCE(reviews.total_reviews, 0) AS total_reviews,
      COALESCE(completed.total_earnings, 0) AS total_earnings,
      COALESCE(completed.earnings_currency, 'NGN') AS earnings_currency,
      u.created_at::text AS created_at
    FROM users u
    LEFT JOIN (
      SELECT
        bid.helper_id,
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed_orders,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN bid.amount ELSE 0 END)::numeric AS total_earnings,
        MAX(CASE WHEN b.status = 'COMPLETED' THEN bid.currency ELSE NULL END) AS earnings_currency
      FROM bids bid
      JOIN bounties b ON b.id = bid.bounty_id
      WHERE bid.status = 'ACCEPTED'
      GROUP BY bid.helper_id
    ) completed ON completed.helper_id = u.id
    LEFT JOIN (
      SELECT
        target_id AS helper_id,
        AVG(rating)::numeric(10,2) AS average_rating,
        (AVG(rating) * 20)::numeric(10,2) AS rating_percentage,
        COUNT(*) AS total_reviews
      FROM reviews
      GROUP BY target_id
    ) reviews ON reviews.helper_id = u.id
    WHERE u.id = ${id}
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
      .map((user) => localWithHelperMetrics(store, user))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  }

  const search = query?.trim() ? `%${query.trim()}%` : null;
  const rows = await sql`
    SELECT
      u.id,
      u.email,
      u.phone,
      u.name,
      u.first_name,
      u.last_name,
      u.date_of_birth::text AS date_of_birth,
      u.gender,
      u.avatar_url,
      u.role,
      u.bio,
      u.city,
      u.country,
      u.country_code,
      COALESCE(completed.completed_orders, 0) AS completed_orders,
      reviews.average_rating,
      reviews.rating_percentage,
      COALESCE(reviews.total_reviews, 0) AS total_reviews,
      COALESCE(completed.total_earnings, 0) AS total_earnings,
      COALESCE(completed.earnings_currency, 'NGN') AS earnings_currency,
      u.created_at::text AS created_at
    FROM users u
    LEFT JOIN (
      SELECT
        bid.helper_id,
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed_orders,
        SUM(CASE WHEN b.status = 'COMPLETED' THEN bid.amount ELSE 0 END)::numeric AS total_earnings,
        MAX(CASE WHEN b.status = 'COMPLETED' THEN bid.currency ELSE NULL END) AS earnings_currency
      FROM bids bid
      JOIN bounties b ON b.id = bid.bounty_id
      WHERE bid.status = 'ACCEPTED'
      GROUP BY bid.helper_id
    ) completed ON completed.helper_id = u.id
    LEFT JOIN (
      SELECT
        target_id AS helper_id,
        AVG(rating)::numeric(10,2) AS average_rating,
        (AVG(rating) * 20)::numeric(10,2) AS rating_percentage,
        COUNT(*) AS total_reviews
      FROM reviews
      GROUP BY target_id
    ) reviews ON reviews.helper_id = u.id
    WHERE u.role = 'HELPER'
      AND (
        ${search}::text IS NULL
        OR u.name ILIKE ${search}
        OR u.city ILIKE ${search}
        OR u.country ILIKE ${search}
        OR u.bio ILIKE ${search}
      )
    ORDER BY u.created_at DESC
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

export async function completeBounty(input: {
  bountyId: string;
  seekerId: string;
}): Promise<{ bounty: DbBounty; acceptedBid: DbBid } | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    if (
      !bounty ||
      bounty.seeker_id !== input.seekerId ||
      !["IN_PROGRESS", "AWAITING_APPROVAL", "INCOMPLETE"].includes(bounty.status)
    ) {
      return null;
    }

    const acceptedBid = store.bids.find(
      (candidate) =>
        candidate.bounty_id === input.bountyId &&
        candidate.status === "ACCEPTED"
    );
    if (!acceptedBid) {
      return null;
    }

    const now = new Date().toISOString();
    bounty.status = "COMPLETED";
    bounty.updated_at = now;
    await writeLocalStore(store);

    return {
      bounty: localJoinBounty(store, bounty),
      acceptedBid: localBidWithHelper(store, acceptedBid),
    };
  }

  const bounty = await getBountyById(input.bountyId);
  if (
    !bounty ||
    bounty.seeker_id !== input.seekerId ||
    !["IN_PROGRESS", "AWAITING_APPROVAL", "INCOMPLETE"].includes(bounty.status)
  ) {
    return null;
  }

  const acceptedBidRows = await sql`
    SELECT id
    FROM bids
    WHERE bounty_id = ${input.bountyId}
      AND status = 'ACCEPTED'
    LIMIT 1
  `;
  const acceptedBidId = (acceptedBidRows[0] as { id: string } | undefined)?.id;
  if (!acceptedBidId) {
    return null;
  }

  const updateRows = await sql`
    UPDATE bounties
    SET status = 'COMPLETED', updated_at = now()
    WHERE id = ${input.bountyId}
      AND seeker_id = ${input.seekerId}
      AND status IN ('IN_PROGRESS', 'AWAITING_APPROVAL', 'INCOMPLETE')
    RETURNING id
  `;
  if (!updateRows[0]?.id) {
    return null;
  }

  const updatedBounty = await getBountyById(input.bountyId);
  const acceptedBid = await getBidById(acceptedBidId);
  if (!updatedBounty || !acceptedBid) {
    return null;
  }

  return { bounty: updatedBounty, acceptedBid };
}

export async function cancelBounty(input: {
  bountyId: string;
  seekerId: string;
}): Promise<{ bounty: DbBounty; notifiedHelperIds: string[] } | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    if (!bounty || bounty.seeker_id !== input.seekerId || bounty.status !== "OPEN") {
      return null;
    }
    const acceptedBid = store.bids.find(
      (candidate) =>
        candidate.bounty_id === input.bountyId && candidate.status === "ACCEPTED"
    );
    if (acceptedBid) return null;

    const now = new Date().toISOString();
    bounty.status = "CANCELLED";
    bounty.updated_at = now;
    const notifiedHelperIds = Array.from(
      new Set(
        store.bids
          .filter((candidate) => candidate.bounty_id === input.bountyId)
          .map((candidate) => candidate.helper_id)
      )
    );
    store.bids.forEach((candidate) => {
      if (candidate.bounty_id === input.bountyId && candidate.status === "PENDING") {
        candidate.status = "WITHDRAWN";
        candidate.updated_at = now;
      }
    });
    await writeLocalStore(store);
    return { bounty: localJoinBounty(store, bounty), notifiedHelperIds };
  }

  const bounty = await getBountyById(input.bountyId);
  if (!bounty || bounty.seeker_id !== input.seekerId || bounty.status !== "OPEN") {
    return null;
  }
  const acceptedBidRows = await sql`
    SELECT id
    FROM bids
    WHERE bounty_id = ${input.bountyId}
      AND status = 'ACCEPTED'
    LIMIT 1
  `;
  if (acceptedBidRows[0]?.id) return null;

  const helperRows = (await sql`
    SELECT DISTINCT helper_id
    FROM bids
    WHERE bounty_id = ${input.bountyId}
  `) as { helper_id: string }[];
  const notifiedHelperIds = helperRows.map((row) => row.helper_id);

  await sql`
    UPDATE bids
    SET status = 'WITHDRAWN', updated_at = now()
    WHERE bounty_id = ${input.bountyId}
      AND status = 'PENDING'
  `;

  const rows = await sql`
    UPDATE bounties
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = ${input.bountyId}
      AND seeker_id = ${input.seekerId}
      AND status = 'OPEN'
    RETURNING id
  `;
  if (!rows[0]?.id) return null;

  const updatedBounty = await getBountyById(input.bountyId);
  if (!updatedBounty) return null;
  return { bounty: updatedBounty, notifiedHelperIds };
}

export async function markBountyIncomplete(input: {
  bountyId: string;
  seekerId: string;
}): Promise<{ bounty: DbBounty; acceptedBid: DbBid } | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const bounty = store.bounties.find((candidate) => candidate.id === input.bountyId);
    if (
      !bounty ||
      bounty.seeker_id !== input.seekerId ||
      !["IN_PROGRESS", "AWAITING_APPROVAL", "COMPLETED"].includes(bounty.status)
    ) {
      return null;
    }
    const acceptedBid = localGetAcceptedBid(store, input.bountyId);
    if (!acceptedBid) return null;
    bounty.status = "INCOMPLETE";
    bounty.updated_at = new Date().toISOString();
    await writeLocalStore(store);
    return {
      bounty: localJoinBounty(store, bounty),
      acceptedBid,
    };
  }

  const bounty = await getBountyById(input.bountyId);
  if (
    !bounty ||
    bounty.seeker_id !== input.seekerId ||
    !["IN_PROGRESS", "AWAITING_APPROVAL", "COMPLETED"].includes(bounty.status)
  ) {
    return null;
  }

  const acceptedBidRows = await sql`
    SELECT id
    FROM bids
    WHERE bounty_id = ${input.bountyId}
      AND status = 'ACCEPTED'
    LIMIT 1
  `;
  const acceptedBidId = (acceptedBidRows[0] as { id: string } | undefined)?.id;
  if (!acceptedBidId) return null;

  const rows = await sql`
    UPDATE bounties
    SET status = 'INCOMPLETE', updated_at = now()
    WHERE id = ${input.bountyId}
      AND seeker_id = ${input.seekerId}
      AND status IN ('IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED')
    RETURNING id
  `;
  if (!rows[0]?.id) return null;

  const updatedBounty = await getBountyById(input.bountyId);
  const acceptedBid = await getBidById(acceptedBidId);
  if (!updatedBounty || !acceptedBid) return null;
  return { bounty: updatedBounty, acceptedBid };
}

export async function getReviewByBountyAndAuthor(
  bountyId: string,
  authorId: string
): Promise<DbReview | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const review = store.reviews.find(
      (candidate) =>
        candidate.bounty_id === bountyId && candidate.author_id === authorId
    );
    if (!review) return null;
    const author = store.users.find((candidate) => candidate.id === authorId);
    return {
      ...review,
      author_name: author?.name ?? "KinSous user",
      author_avatar_url: author?.avatar_url ?? null,
    };
  }

  const rows = await sql`
    SELECT
      review.id,
      review.bounty_id,
      review.author_id,
      review.target_id,
      review.rating,
      review.comment,
      review.created_at::text AS created_at,
      review.updated_at::text AS updated_at,
      author.name AS author_name,
      author.avatar_url AS author_avatar_url
    FROM reviews review
    JOIN users author ON author.id = review.author_id
    WHERE review.bounty_id = ${bountyId}
      AND review.author_id = ${authorId}
    LIMIT 1
  `;
  return (rows[0] as DbReview | undefined) ?? null;
}

export async function createOrUpdateBountyReview(input: {
  bountyId: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment: string;
}): Promise<DbReview | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const now = new Date().toISOString();
    const existing = store.reviews.find(
      (candidate) =>
        candidate.bounty_id === input.bountyId && candidate.author_id === input.authorId
    );
    if (existing) {
      existing.target_id = input.targetId;
      existing.rating = input.rating;
      existing.comment = input.comment;
      existing.updated_at = now;
      await writeLocalStore(store);
      return getReviewByBountyAndAuthor(input.bountyId, input.authorId);
    }
    store.reviews.push({
      id: uid("review"),
      bounty_id: input.bountyId,
      author_id: input.authorId,
      target_id: input.targetId,
      rating: input.rating,
      comment: input.comment,
      created_at: now,
      updated_at: now,
    });
    await writeLocalStore(store);
    return getReviewByBountyAndAuthor(input.bountyId, input.authorId);
  }

  const rows = await sql`
    INSERT INTO reviews (bounty_id, author_id, target_id, rating, comment)
    VALUES (
      ${input.bountyId},
      ${input.authorId},
      ${input.targetId},
      ${input.rating},
      ${input.comment}
    )
    ON CONFLICT (bounty_id, author_id) DO UPDATE
      SET
        target_id = EXCLUDED.target_id,
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = now()
    RETURNING id
  `;
  if (!rows[0]?.id) return null;
  return getReviewByBountyAndAuthor(input.bountyId, input.authorId);
}

export async function listHelperInteractionHistory(
  helperId: string,
  limit = 25
): Promise<DbHelperInteractionHistoryRow[]> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.bids
      .filter((bid) => bid.helper_id === helperId && bid.status === "ACCEPTED")
      .map((bid) => {
        const bounty = store.bounties.find((candidate) => candidate.id === bid.bounty_id);
        if (!bounty) return null;
        const review = store.reviews.find(
          (candidate) =>
            candidate.bounty_id === bid.bounty_id &&
            candidate.target_id === helperId &&
            candidate.author_id === bounty.seeker_id
        );
        return {
          bounty_id: bounty.id,
          bounty_title: bounty.title,
          bounty_status: bounty.status,
          city: bounty.city,
          country: bounty.country,
          accepted_amount: bid.amount,
          currency: bid.currency,
          interacted_at: bounty.updated_at,
          review_id: review?.id ?? null,
          review_rating: review?.rating ?? null,
          review_comment: review?.comment ?? null,
          review_created_at: review?.created_at ?? null,
        } satisfies DbHelperInteractionHistoryRow;
      })
      .filter((row): row is DbHelperInteractionHistoryRow => Boolean(row))
      .sort(
        (a, b) =>
          new Date(b.interacted_at).getTime() - new Date(a.interacted_at).getTime()
      )
      .slice(0, limit);
  }

  const rows = await sql`
    SELECT
      b.id AS bounty_id,
      b.title AS bounty_title,
      b.status AS bounty_status,
      b.city,
      b.country,
      bid.amount AS accepted_amount,
      bid.currency,
      b.updated_at::text AS interacted_at,
      review.id AS review_id,
      review.rating AS review_rating,
      review.comment AS review_comment,
      review.created_at::text AS review_created_at
    FROM bids bid
    JOIN bounties b ON b.id = bid.bounty_id
    LEFT JOIN reviews review
      ON review.bounty_id = b.id
     AND review.target_id = ${helperId}
     AND review.author_id = b.seeker_id
    WHERE bid.helper_id = ${helperId}
      AND bid.status = 'ACCEPTED'
    ORDER BY b.updated_at DESC
    LIMIT ${limit}
  `;
  return rows as DbHelperInteractionHistoryRow[];
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
          content: message.deleted_at ? "Message deleted" : message.content,
          edited_at: message.edited_at ?? null,
          deleted_at: message.deleted_at ?? null,
          deleted_by: message.deleted_by ?? null,
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
      CASE WHEN m.deleted_at IS NOT NULL THEN 'Message deleted' ELSE m.content END AS content,
      m.read,
      m.edited_at::text AS edited_at,
      m.deleted_at::text AS deleted_at,
      m.deleted_by,
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
    const otherId =
      conversation.user_one_id === input.senderId ? conversation.user_two_id : conversation.user_one_id;
    const blocked = store.user_blocks.some(
      (entry) =>
        (entry.blocker_id === input.senderId && entry.blocked_id === otherId) ||
        (entry.blocker_id === otherId && entry.blocked_id === input.senderId)
    );
    if (blocked) return null;
    const now = new Date().toISOString();
    const message = {
      id: uid("msg"),
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      type: input.type,
      content: input.content,
      read: input.type === "SYSTEM",
      created_at: now,
      edited_at: null,
      deleted_at: null,
      deleted_by: null,
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
  if (conversation.blocked_by_me || conversation.blocked_by_other) return null;

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
      m.edited_at::text AS edited_at,
      m.deleted_at::text AS deleted_at,
      m.deleted_by,
      m.created_at::text AS created_at
    FROM conversation_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${rows[0].id}
    LIMIT 1
  `;

  return (messages[0] as DbConversationMessage | undefined) ?? null;
}

export async function updateConversationMessage(input: {
  conversationId: string;
  messageId: string;
  userId: string;
  content: string;
}): Promise<DbConversationMessage | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const message = store.conversation_messages.find(
      (candidate) =>
        candidate.id === input.messageId &&
        candidate.conversation_id === input.conversationId &&
        candidate.sender_id === input.userId
    );
    if (!message || message.deleted_at) return null;
    const now = new Date().toISOString();
    message.content = input.content;
    message.edited_at = now;
    const sender = store.users.find((user) => user.id === input.userId);
    await writeLocalStore(store);
    return {
      ...message,
      sender_name: sender?.name ?? "KinSous",
      sender_avatar_url: sender?.avatar_url ?? null,
      content: message.deleted_at ? "Message deleted" : message.content,
      edited_at: message.edited_at ?? null,
      deleted_at: message.deleted_at ?? null,
      deleted_by: message.deleted_by ?? null,
    };
  }

  const conversation = await getConversationForUser(input.conversationId, input.userId);
  if (!conversation) return null;

  const rows = await sql`
    UPDATE conversation_messages
    SET content = ${input.content},
        edited_at = now()
    WHERE id = ${input.messageId}
      AND conversation_id = ${input.conversationId}
      AND sender_id = ${input.userId}
      AND deleted_at IS NULL
    RETURNING id
  `;
  if (!rows[0]?.id) return null;

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
      m.edited_at::text AS edited_at,
      m.deleted_at::text AS deleted_at,
      m.deleted_by,
      m.created_at::text AS created_at
    FROM conversation_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${rows[0].id}
    LIMIT 1
  `;

  return (messages[0] as DbConversationMessage | undefined) ?? null;
}

export async function deleteConversationMessage(input: {
  conversationId: string;
  messageId: string;
  userId: string;
}): Promise<DbConversationMessage | null> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const message = store.conversation_messages.find(
      (candidate) =>
        candidate.id === input.messageId &&
        candidate.conversation_id === input.conversationId &&
        candidate.sender_id === input.userId
    );
    if (!message || message.deleted_at) return null;
    const now = new Date().toISOString();
    message.deleted_at = now;
    message.deleted_by = input.userId;
    const sender = store.users.find((user) => user.id === input.userId);
    await writeLocalStore(store);
    return {
      ...message,
      sender_name: sender?.name ?? "KinSous",
      sender_avatar_url: sender?.avatar_url ?? null,
      content: "Message deleted",
      edited_at: message.edited_at ?? null,
      deleted_at: message.deleted_at ?? null,
      deleted_by: message.deleted_by ?? null,
    };
  }

  const conversation = await getConversationForUser(input.conversationId, input.userId);
  if (!conversation) return null;

  const rows = await sql`
    UPDATE conversation_messages
    SET deleted_at = now(),
        deleted_by = ${input.userId}
    WHERE id = ${input.messageId}
      AND conversation_id = ${input.conversationId}
      AND sender_id = ${input.userId}
      AND deleted_at IS NULL
    RETURNING id
  `;
  if (!rows[0]?.id) return null;

  const messages = await sql`
    SELECT
      m.id,
      m.conversation_id,
      m.sender_id,
      u.name AS sender_name,
      u.avatar_url AS sender_avatar_url,
      m.type,
      CASE WHEN m.deleted_at IS NOT NULL THEN 'Message deleted' ELSE m.content END AS content,
      m.read,
      m.edited_at::text AS edited_at,
      m.deleted_at::text AS deleted_at,
      m.deleted_by,
      m.created_at::text AS created_at
    FROM conversation_messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${rows[0].id}
    LIMIT 1
  `;

  return (messages[0] as DbConversationMessage | undefined) ?? null;
}

export async function deleteConversationForUser(
  conversationId: string,
  userId: string
) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const existing = store.conversation_deletions.find(
      (entry) => entry.conversation_id === conversationId && entry.user_id === userId
    );
    if (!existing) {
      store.conversation_deletions.push({
        conversation_id: conversationId,
        user_id: userId,
        deleted_at: new Date().toISOString(),
      });
      await writeLocalStore(store);
    }
    return;
  }

  await sql`
    INSERT INTO conversation_deletions (conversation_id, user_id)
    VALUES (${conversationId}, ${userId})
    ON CONFLICT (conversation_id, user_id) DO UPDATE
      SET deleted_at = now()
  `;
}

export async function blockUser(blockerId: string, blockedId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const exists = store.user_blocks.some(
      (entry) => entry.blocker_id === blockerId && entry.blocked_id === blockedId
    );
    if (!exists) {
      store.user_blocks.push({
        id: uid("block"),
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(),
      });
      await writeLocalStore(store);
    }
    return;
  }

  await sql`
    INSERT INTO user_blocks (blocker_id, blocked_id)
    VALUES (${blockerId}, ${blockedId})
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING
  `;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    store.user_blocks = store.user_blocks.filter(
      (entry) => !(entry.blocker_id === blockerId && entry.blocked_id === blockedId)
    );
    await writeLocalStore(store);
    return;
  }

  await sql`
    DELETE FROM user_blocks
    WHERE blocker_id = ${blockerId}
      AND blocked_id = ${blockedId}
  `;
}

export async function getBlockStatus(userId: string, otherUserId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const blockedByMe = store.user_blocks.some(
      (entry) => entry.blocker_id === userId && entry.blocked_id === otherUserId
    );
    const blockedByOther = store.user_blocks.some(
      (entry) => entry.blocker_id === otherUserId && entry.blocked_id === userId
    );
    return { blockedByMe, blockedByOther };
  }

  const rows = (await sql`
    SELECT blocker_id, blocked_id
    FROM user_blocks
    WHERE (blocker_id = ${userId} AND blocked_id = ${otherUserId})
       OR (blocker_id = ${otherUserId} AND blocked_id = ${userId})
  `) as { blocker_id: string; blocked_id: string }[];
  const blockedByMe = rows.some(
    (row) => row.blocker_id === userId && row.blocked_id === otherUserId
  );
  const blockedByOther = rows.some(
    (row) => row.blocker_id === otherUserId && row.blocked_id === userId
  );
  return { blockedByMe, blockedByOther };
}

export async function reportConversationMessage(input: {
  conversationId: string;
  reporterId: string;
  reportedUserId: string;
  messageId?: string | null;
  reason: string;
}) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    store.message_reports.push({
      id: uid("report"),
      conversation_id: input.conversationId,
      reporter_id: input.reporterId,
      reported_user_id: input.reportedUserId,
      message_id: input.messageId ?? null,
      reason: input.reason,
      created_at: new Date().toISOString(),
    });
    await writeLocalStore(store);
    return;
  }

  await sql`
    INSERT INTO message_reports (
      conversation_id,
      reporter_id,
      reported_user_id,
      message_id,
      reason
    )
    VALUES (
      ${input.conversationId},
      ${input.reporterId},
      ${input.reportedUserId},
      ${input.messageId ?? null},
      ${input.reason}
    )
  `;
}

export async function listConversationIdsForUser(userId: string): Promise<string[]> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const deleted = new Set(
      store.conversation_deletions
        .filter((entry) => entry.user_id === userId)
        .map((entry) => entry.conversation_id)
    );
    return store.conversations
      .filter((conversation) =>
        conversation.user_one_id === userId || conversation.user_two_id === userId
      )
      .filter((conversation) => !deleted.has(conversation.id))
      .map((conversation) => conversation.id);
  }

  const rows = await sql`
    SELECT c.id
    FROM conversations c
    LEFT JOIN conversation_deletions cd
      ON cd.conversation_id = c.id
     AND cd.user_id = ${userId}
    WHERE (c.user_one_id = ${userId} OR c.user_two_id = ${userId})
      AND cd.conversation_id IS NULL
  `;
  return (rows as { id: string }[]).map((row) => row.id);
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  avatarUrl?: string | null;
  href?: string | null;
}): Promise<DbNotification> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const notification = {
      id: uid("notif"),
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      avatar_url: input.avatarUrl ?? null,
      href: input.href ?? null,
      read: false,
      created_at: new Date().toISOString(),
    };
    store.notifications.unshift(notification);
    await writeLocalStore(store);
    return notification;
  }

  const rows = await sql`
    INSERT INTO notifications (
      user_id,
      type,
      title,
      body,
      avatar_url,
      href
    )
    VALUES (
      ${input.userId},
      ${input.type},
      ${input.title},
      ${input.body},
      ${input.avatarUrl ?? null},
      ${input.href ?? null}
    )
    RETURNING
      id,
      user_id,
      type,
      title,
      body,
      avatar_url,
      href,
      read,
      created_at::text AS created_at
  `;
  return rows[0] as DbNotification;
}

export async function listNotificationsForUser(userId: string): Promise<DbNotification[]> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.notifications
      .filter((notification) => notification.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const rows = await sql`
    SELECT
      id,
      user_id,
      type,
      title,
      body,
      avatar_url,
      href,
      read,
      created_at::text AS created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return rows as DbNotification[];
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const notification = store.notifications.find(
      (entry) => entry.id === notificationId && entry.user_id === userId
    );
    if (notification) {
      notification.read = true;
      await writeLocalStore(store);
    }
    return;
  }

  await sql`
    UPDATE notifications
    SET read = true
    WHERE id = ${notificationId}
      AND user_id = ${userId}
  `;
}

export async function markAllNotificationsRead(userId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    store.notifications = store.notifications.map((entry) =>
      entry.user_id === userId ? { ...entry, read: true } : entry
    );
    await writeLocalStore(store);
    return;
  }

  await sql`
    UPDATE notifications
    SET read = true
    WHERE user_id = ${userId}
  `;
}

export async function dismissNotification(userId: string, notificationId: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    store.notifications = store.notifications.filter(
      (entry) => !(entry.id === notificationId && entry.user_id === userId)
    );
    await writeLocalStore(store);
    return;
  }

  await sql`
    DELETE FROM notifications
    WHERE id = ${notificationId}
      AND user_id = ${userId}
  `;
}

export async function upsertUserPresence(input: {
  userId: string;
  status: string;
}): Promise<DbUserPresence> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const now = new Date().toISOString();
    const existing = store.user_presence.find((entry) => entry.user_id === input.userId);
    if (existing) {
      existing.status = input.status;
      existing.last_seen = now;
      existing.updated_at = now;
      await writeLocalStore(store);
      return existing;
    }
    const presence = {
      user_id: input.userId,
      status: input.status,
      last_seen: now,
      updated_at: now,
    };
    store.user_presence.push(presence);
    await writeLocalStore(store);
    return presence;
  }

  const rows = await sql`
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (${input.userId}, ${input.status}, now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET status = EXCLUDED.status,
          last_seen = now(),
          updated_at = now()
    RETURNING
      user_id,
      status,
      last_seen::text AS last_seen,
      updated_at::text AS updated_at
  `;
  return rows[0] as DbUserPresence;
}

export async function getPresenceForUsers(userIds: string[]): Promise<DbUserPresence[]> {
  await initDb();
  if (userIds.length === 0) return [];
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.user_presence.filter((entry) => userIds.includes(entry.user_id));
  }

  const rows = await sql`
    SELECT
      user_id,
      status,
      last_seen::text AS last_seen,
      updated_at::text AS updated_at
    FROM user_presence
    WHERE user_id = ANY(${userIds})
  `;
  return rows as DbUserPresence[];
}

export async function upsertConversationTyping(input: {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}): Promise<DbConversationTyping> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const now = new Date().toISOString();
    const existing = store.conversation_typing.find(
      (entry) =>
        entry.conversation_id === input.conversationId && entry.user_id === input.userId
    );
    if (existing) {
      existing.is_typing = input.isTyping;
      existing.updated_at = now;
      await writeLocalStore(store);
      return existing;
    }
    const typing = {
      conversation_id: input.conversationId,
      user_id: input.userId,
      is_typing: input.isTyping,
      updated_at: now,
    };
    store.conversation_typing.push(typing);
    await writeLocalStore(store);
    return typing;
  }

  const rows = await sql`
    INSERT INTO conversation_typing (conversation_id, user_id, is_typing, updated_at)
    VALUES (${input.conversationId}, ${input.userId}, ${input.isTyping}, now())
    ON CONFLICT (conversation_id, user_id) DO UPDATE
      SET is_typing = EXCLUDED.is_typing,
          updated_at = now()
    RETURNING
      conversation_id,
      user_id,
      is_typing,
      updated_at::text AS updated_at
  `;
  return rows[0] as DbConversationTyping;
}

export async function listTypingForConversation(conversationId: string): Promise<DbConversationTyping[]> {
  await initDb();
  const cutoff = new Date(Date.now() - 1000 * 8).toISOString();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.conversation_typing.filter(
      (entry) =>
        entry.conversation_id === conversationId &&
        entry.is_typing &&
        entry.updated_at >= cutoff
    );
  }

  const rows = await sql`
    SELECT
      conversation_id,
      user_id,
      is_typing,
      updated_at::text AS updated_at
    FROM conversation_typing
    WHERE conversation_id = ${conversationId}
      AND is_typing = true
      AND updated_at >= ${cutoff}::timestamptz
  `;
  return rows as DbConversationTyping[];
}

export async function upsertPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<DbPushSubscription> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    const now = new Date().toISOString();
    const existing = store.push_subscriptions.find(
      (entry) => entry.user_id === input.userId && entry.endpoint === input.endpoint
    );
    if (existing) {
      existing.p256dh = input.p256dh;
      existing.auth = input.auth;
      existing.updated_at = now;
      await writeLocalStore(store);
      return existing;
    }
    const subscription = {
      id: uid("push"),
      user_id: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      created_at: now,
      updated_at: now,
    };
    store.push_subscriptions.push(subscription);
    await writeLocalStore(store);
    return subscription;
  }

  const rows = await sql`
    INSERT INTO push_subscriptions (
      user_id,
      endpoint,
      p256dh,
      auth
    )
    VALUES (
      ${input.userId},
      ${input.endpoint},
      ${input.p256dh},
      ${input.auth}
    )
    ON CONFLICT (user_id, endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          updated_at = now()
    RETURNING
      id,
      user_id,
      endpoint,
      p256dh,
      auth,
      created_at::text AS created_at,
      updated_at::text AS updated_at
  `;
  return rows[0] as DbPushSubscription;
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    store.push_subscriptions = store.push_subscriptions.filter(
      (entry) => !(entry.user_id === userId && entry.endpoint === endpoint)
    );
    await writeLocalStore(store);
    return;
  }

  await sql`
    DELETE FROM push_subscriptions
    WHERE user_id = ${userId}
      AND endpoint = ${endpoint}
  `;
}

export async function listPushSubscriptions(userId: string): Promise<DbPushSubscription[]> {
  await initDb();
  if (usingLocalDb()) {
    const store = await readLocalStore();
    return store.push_subscriptions.filter((entry) => entry.user_id === userId);
  }

  const rows = await sql`
    SELECT
      id,
      user_id,
      endpoint,
      p256dh,
      auth,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM push_subscriptions
    WHERE user_id = ${userId}
  `;
  return rows as DbPushSubscription[];
}
