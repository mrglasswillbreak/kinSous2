CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    );

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'SEEKER';

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx
    ON users (phone)
    WHERE phone IS NOT NULL;

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
    );

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS budget NUMERIC;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS seeker_id TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE bounties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

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
    );

ALTER TABLE bids ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS bounty_id TEXT;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS helper_id TEXT;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS amount NUMERIC;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';

ALTER TABLE bids ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS estimated_delivery_minutes INTEGER DEFAULT 60;

ALTER TABLE bids ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

ALTER TABLE bids ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE bids ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS bids_bounty_created_idx
    ON bids (bounty_id, created_at DESC)
    WHERE bounty_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bids_open_helper_unique_idx
    ON bids (bounty_id, helper_id)
    WHERE status IN ('PENDING', 'ACCEPTED')
      AND bounty_id IS NOT NULL
      AND helper_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS conversations (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_one_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_two_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bounty_id   TEXT REFERENCES bounties(id) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_one_id TEXT;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_two_id TEXT;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bounty_id TEXT;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS conversations_direct_lookup_idx
    ON conversations (
      LEAST(user_one_id, user_two_id),
      GREATEST(user_one_id, user_two_id),
      COALESCE(bounty_id, '')
    )
    WHERE user_one_id IS NOT NULL
      AND user_two_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS conversation_messages (
      id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            TEXT NOT NULL DEFAULT 'TEXT',
      content         TEXT NOT NULL,
      read            BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS conversation_id TEXT;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS sender_id TEXT;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'TEXT';

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX IF NOT EXISTS conversation_messages_conversation_idx
    ON conversation_messages (conversation_id, created_at);

CREATE TABLE IF NOT EXISTS conversation_deletions (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deleted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    );

CREATE TABLE IF NOT EXISTS user_blocks (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (blocker_id, blocked_id)
    );

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
    );

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
    );

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS bounty_id TEXT;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_id TEXT;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS target_id TEXT;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment TEXT;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS reviews_bounty_author_unique_idx
    ON reviews (bounty_id, author_id)
    WHERE bounty_id IS NOT NULL
      AND author_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reviews_target_created_idx
    ON reviews (target_id, created_at DESC)
    WHERE target_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_presence (
      user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      status     TEXT NOT NULL DEFAULT 'OFFLINE',
      last_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE TABLE IF NOT EXISTS conversation_typing (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_typing       BOOLEAN NOT NULL DEFAULT false,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (conversation_id, user_id)
    );

CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, endpoint)
    );

CREATE TABLE IF NOT EXISTS message_reports (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      reporter_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message_id       TEXT,
      reason           TEXT NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
