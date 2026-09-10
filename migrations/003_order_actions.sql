CREATE OR REPLACE FUNCTION transition_order(p_id text,p_actor text,p_stage text,p_note text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE o orders;
BEGIN
 SELECT * INTO o FROM orders WHERE id=p_id FOR UPDATE;
 IF o.id IS NULL OR p_actor NOT IN (o.seeker_id,o.helper_id) THEN RETURN false; END IF;
 IF p_stage='DISPUTE' THEN
  IF o.stage IN ('COMPLETED','REFUNDED','CANCELLED') OR o.dispute_status<>'NONE' THEN RETURN false; END IF;
  UPDATE orders SET dispute_status='OPEN',updated_at=now() WHERE id=p_id;
 ELSE
  IF o.dispute_status='OPEN' THEN RETURN false; END IF;
  IF p_stage='COMPLETED' THEN
   IF o.stage<>'DELIVERED' OR p_actor<>o.seeker_id THEN RETURN false; END IF;
   INSERT INTO transfers(id,order_id,kind) VALUES('payout-'||p_id,p_id,'PAYOUT') ON CONFLICT DO NOTHING;
   UPDATE bounties SET status='COMPLETED',updated_at=now() WHERE id=p_id;
  ELSE
   IF p_actor<>o.helper_id OR NOT ((o.stage='PAID' AND p_stage='SHOPPING') OR (o.stage='SHOPPING' AND p_stage='IN_TRANSIT') OR (o.stage='IN_TRANSIT' AND p_stage='DELIVERED')) THEN RETURN false; END IF;
   IF p_stage='DELIVERED' THEN UPDATE bounties SET status='AWAITING_APPROVAL',updated_at=now() WHERE id=p_id; END IF;
  END IF;
  UPDATE orders SET stage=p_stage,updated_at=now() WHERE id=p_id;
 END IF;
 INSERT INTO order_events(order_id,actor_id,stage,note) VALUES(p_id,p_actor,p_stage,p_note);
 INSERT INTO notifications(user_id,type,title,body,href) VALUES(CASE WHEN p_actor=o.seeker_id THEN o.helper_id ELSE o.seeker_id END,'SYSTEM','Order update','Your order has a new update.','/payment?bountyId='||p_id);
 RETURN true;
END $$;
