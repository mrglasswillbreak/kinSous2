DELETE FROM push_subscriptions a USING push_subscriptions b WHERE a.endpoint=b.endpoint AND (a.updated_at,a.id)<(b.updated_at,b.id);
CREATE UNIQUE INDEX one_account_per_push_endpoint ON push_subscriptions(endpoint);
