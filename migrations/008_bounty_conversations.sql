CREATE OR REPLACE FUNCTION direct_conversation(first_user TEXT, second_user TEXT, context_bounty TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE conversation_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(first_user), hashtext(second_user));
  SELECT id INTO conversation_id FROM conversations
    WHERE user_one_id=first_user AND user_two_id=second_user
      AND bounty_id IS NOT DISTINCT FROM context_bounty
    ORDER BY created_at LIMIT 1;
  IF conversation_id IS NULL THEN
    INSERT INTO conversations(user_one_id,user_two_id,bounty_id)
      VALUES(first_user,second_user,context_bounty) RETURNING id INTO conversation_id;
  END IF;
  RETURN conversation_id;
END;
$$;
