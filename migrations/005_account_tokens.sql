CREATE OR REPLACE FUNCTION redeem_account_token(p_hash text,p_password text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE t auth_tokens;
BEGIN
 SELECT * INTO t FROM auth_tokens WHERE id=p_hash AND used_at IS NULL AND expires_at>now() FOR UPDATE;
 IF t.id IS NULL THEN RETURN false; END IF;
 IF t.kind='RESET' THEN
  IF p_password IS NULL THEN RETURN false; END IF;
  UPDATE users SET password_hash=p_password WHERE id=t.user_id;
 ELSE
  UPDATE users SET email=t.email,email_verified_at=now() WHERE id=t.user_id;
 END IF;
 UPDATE auth_tokens SET used_at=now() WHERE user_id=t.user_id AND kind=t.kind;
 DELETE FROM sessions WHERE user_id=t.user_id;
 RETURN true;
END $$;
