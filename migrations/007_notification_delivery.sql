ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;
UPDATE notifications SET push_sent_at=now() WHERE push_sent_at IS NULL;
CREATE INDEX notifications_push_pending ON notifications(created_at) WHERE push_sent_at IS NULL;
CREATE INDEX messages_conversation_page ON conversation_messages(conversation_id,created_at DESC,id DESC);
CREATE INDEX sessions_expiry ON sessions(expires_at);
