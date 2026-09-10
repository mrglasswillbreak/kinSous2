CREATE OR REPLACE FUNCTION resolve_order(p_id text,p_actor text,p_action text,p_reason text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE o orders;
BEGIN
 SELECT * INTO o FROM orders WHERE id=p_id FOR UPDATE;
 IF o.id IS NULL OR EXISTS(SELECT 1 FROM transfers WHERE order_id=p_id) THEN RETURN false; END IF;
 IF p_action='CANCEL' THEN
  IF o.stage<>'AWAITING_PAYMENT' OR EXISTS(SELECT 1 FROM payments WHERE order_id=p_id) THEN RETURN false; END IF;
  UPDATE orders SET stage='CANCELLED',dispute_status='RESOLVED',updated_at=now() WHERE id=p_id;
  UPDATE bounties SET status='CANCELLED',updated_at=now() WHERE id=p_id;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM payments WHERE order_id=p_id AND status='PAID') THEN RETURN false; END IF;
  IF p_action='RELEASE' AND o.stage<>'DELIVERED' THEN RETURN false; END IF;
  INSERT INTO transfers(id,order_id,kind) VALUES(lower(p_action)||'-'||p_id,p_id,CASE WHEN p_action='REFUND' THEN 'REFUND' ELSE 'PAYOUT' END);
  UPDATE orders SET stage=CASE WHEN p_action='REFUND' THEN 'REFUND_PENDING' ELSE 'COMPLETED' END,dispute_status='RESOLVED',updated_at=now() WHERE id=p_id;
  UPDATE bounties SET status=CASE WHEN p_action='REFUND' THEN 'CANCELLED' ELSE 'COMPLETED' END,updated_at=now() WHERE id=p_id;
 END IF;
 INSERT INTO order_events(order_id,actor_id,stage,note) VALUES(p_id,p_actor,p_action,p_reason);
 INSERT INTO admin_audit(actor_id,action,target_id,reason) VALUES(p_actor,p_action,p_id,p_reason);
 RETURN true;
END $$;
