ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_bank text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_name text;
-- statement-break
CREATE TABLE sessions (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
-- statement-break
CREATE TABLE auth_tokens (id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id), kind text NOT NULL, email text, expires_at timestamptz NOT NULL, used_at timestamptz);
-- statement-break
CREATE TABLE rate_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
-- statement-break
CREATE TABLE orders (
 id text PRIMARY KEY REFERENCES bounties(id), bid_id text UNIQUE NOT NULL REFERENCES bids(id),
 seeker_id text NOT NULL REFERENCES users(id), helper_id text NOT NULL REFERENCES users(id),
 amount_kobo bigint NOT NULL CHECK(amount_kobo > 0), commission_kobo bigint NOT NULL,
 helper_kobo bigint NOT NULL, currency text NOT NULL DEFAULT 'NGN' CHECK(currency='NGN'),
 stage text NOT NULL DEFAULT 'AWAITING_PAYMENT', dispute_status text NOT NULL DEFAULT 'NONE',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(amount_kobo=commission_kobo+helper_kobo)
);
-- statement-break
CREATE TABLE order_events (id text PRIMARY KEY DEFAULT gen_random_uuid()::text, order_id text NOT NULL REFERENCES orders(id), actor_id text REFERENCES users(id), stage text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now());
-- statement-break
CREATE TABLE payments (id text PRIMARY KEY, order_id text NOT NULL REFERENCES orders(id), status text NOT NULL DEFAULT 'PENDING', provider_id text UNIQUE, checkout_url text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
-- statement-break
CREATE UNIQUE INDEX one_active_payment ON payments(order_id) WHERE status IN ('PENDING','PAID');
-- statement-break
CREATE TABLE transfers (id text PRIMARY KEY, order_id text NOT NULL UNIQUE REFERENCES orders(id), kind text NOT NULL, status text NOT NULL DEFAULT 'PENDING', provider_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
-- statement-break
CREATE TABLE webhook_events (id text PRIMARY KEY, payload jsonb NOT NULL, processed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
-- statement-break
CREATE TABLE admin_audit (id text PRIMARY KEY DEFAULT gen_random_uuid()::text, actor_id text NOT NULL REFERENCES users(id), action text NOT NULL, target_id text NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
-- statement-break
CREATE TABLE attachments (id text PRIMARY KEY, conversation_id text NOT NULL REFERENCES conversations(id), owner_id text NOT NULL REFERENCES users(id), pathname text NOT NULL, content_type text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
-- statement-break
ALTER TABLE conversation_messages ADD COLUMN IF NOT EXISTS client_id text;
-- statement-break
CREATE UNIQUE INDEX message_submission_id ON conversation_messages(sender_id,client_id) WHERE client_id IS NOT NULL;
-- statement-break
CREATE UNIQUE INDEX one_accepted_bid ON bids(bounty_id) WHERE status='ACCEPTED';
-- statement-break
CREATE OR REPLACE FUNCTION accept_order(p_bounty text,p_bid text,p_seeker text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE b bounties; chosen bids; k bigint;
BEGIN
 SELECT * INTO b FROM bounties WHERE id=p_bounty FOR UPDATE;
 IF b.id IS NULL OR b.seeker_id<>p_seeker OR b.status<>'OPEN' OR b.currency<>'NGN' THEN RETURN NULL; END IF;
 SELECT * INTO chosen FROM bids WHERE id=p_bid AND bounty_id=p_bounty AND status='PENDING' FOR UPDATE;
 IF chosen.id IS NULL THEN RETURN NULL; END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=chosen.helper_id AND payout_account IS NOT NULL AND suspended_at IS NULL) THEN RETURN NULL; END IF;
 k := round(chosen.amount*100);
 UPDATE bids SET status=CASE WHEN id=p_bid THEN 'ACCEPTED' ELSE 'REJECTED' END,updated_at=now() WHERE bounty_id=p_bounty AND status='PENDING';
 UPDATE bounties SET status='IN_PROGRESS',updated_at=now() WHERE id=p_bounty;
 INSERT INTO orders(id,bid_id,seeker_id,helper_id,amount_kobo,commission_kobo,helper_kobo) VALUES(p_bounty,p_bid,p_seeker,chosen.helper_id,k,k-round(k*0.9),round(k*0.9));
 INSERT INTO order_events(order_id,actor_id,stage) VALUES(p_bounty,p_seeker,'AWAITING_PAYMENT');
 RETURN p_bid;
END $$;
