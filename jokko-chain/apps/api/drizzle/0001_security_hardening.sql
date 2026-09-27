-- ============================================================================================
-- 0001 — Security hardening enforced by the database itself (docs/02-security.md).
--
-- These guarantees hold even if the application has a bug or is compromised:
--   1. Append-only tables reject UPDATE, DELETE and TRUNCATE.
--   2. audit_log is hash-chained: each row stores the SHA-256 of its content + the previous
--      row's hash, so any tampering (even by a database superuser editing rows with triggers
--      disabled) is detectable with jokko_audit_verify().
--   3. A received webhook's payload can never be altered or deleted.
--   4. Reporting reads go through `analytics` views that expose no personal data.
-- ============================================================================================

-- 1. Append-only tables ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION jokko_forbid_modification() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only: % refused', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'audit_log', 'consents', 'login_events', 'ramp_session_events', 'staking_events',
    'pii_access_log', 'data_exports', 'company_wallet_movements'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION jokko_forbid_modification()',
      t || '_append_only', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION jokko_forbid_modification()',
      t || '_no_truncate', t);
  END LOOP;
END;
$$;
--> statement-breakpoint

-- 2. Hash-chained audit log -------------------------------------------------------------------
-- Canonical text of an audit row: every column in a fixed order, NULLs as empty strings,
-- timestamps in UTC with microseconds, jsonb in PostgreSQL's normalised text form.
CREATE OR REPLACE FUNCTION jokko_audit_canonical(r audit_log, previous bytea) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT concat_ws('|',
    r.seq::text,
    r.actor_type::text,
    r.actor_id,
    r.action,
    r.target_type,
    coalesce(r.target_id, ''),
    coalesce(r.before_json::text, ''),
    coalesce(r.after_json::text, ''),
    coalesce(r.ip, ''),
    coalesce(r.device_id, ''),
    coalesce(r.reason, ''),
    to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    coalesce(encode(previous, 'hex'), '')
  );
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION jokko_audit_chain() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  previous bytea;
BEGIN
  -- Serialise writers for the rest of this transaction so each row sees the true previous
  -- hash, then take the sequence number INSIDE the lock so seq order == chain order.
  PERFORM pg_advisory_xact_lock(hashtext('jokko_audit_log_chain'));
  NEW.seq := nextval(pg_get_serial_sequence('audit_log', 'seq'));
  SELECT hash INTO previous FROM audit_log ORDER BY seq DESC LIMIT 1;
  NEW.prev_hash := previous;
  NEW.hash := sha256(convert_to(jokko_audit_canonical(NEW, previous), 'UTF8'));
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_log_hash_chain BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION jokko_audit_chain();
--> statement-breakpoint
-- Re-computes the chain from the start. Returns the rows whose hash or link does not match
-- (an empty result means the log is intact). Run nightly by the worker and on demand.
CREATE OR REPLACE FUNCTION jokko_audit_verify()
RETURNS TABLE (bad_seq bigint, problem text)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r audit_log;
  expected_prev bytea := NULL;
BEGIN
  FOR r IN SELECT * FROM audit_log ORDER BY seq LOOP
    IF r.prev_hash IS DISTINCT FROM expected_prev THEN
      bad_seq := r.seq; problem := 'broken link to previous row'; RETURN NEXT;
    ELSIF r.hash IS DISTINCT FROM sha256(convert_to(jokko_audit_canonical(r, r.prev_hash), 'UTF8')) THEN
      bad_seq := r.seq; problem := 'content does not match hash'; RETURN NEXT;
    END IF;
    expected_prev := r.hash;
  END LOOP;
END;
$$;
--> statement-breakpoint

-- 3. Webhook payloads are immutable -----------------------------------------------------------
CREATE OR REPLACE FUNCTION jokko_webhook_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'webhook_events rows cannot be deleted' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.provider_event_id IS DISTINCT FROM OLD.provider_event_id
     OR NEW.payload_enc IS DISTINCT FROM OLD.payload_enc
     OR NEW.payload_sha256 IS DISTINCT FROM OLD.payload_sha256
     OR NEW.signature_valid IS DISTINCT FROM OLD.signature_valid
     OR NEW.received_at IS DISTINCT FROM OLD.received_at THEN
    RAISE EXCEPTION 'webhook_events payload and identity are immutable'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER webhook_events_immutable BEFORE UPDATE OR DELETE ON webhook_events
  FOR EACH ROW EXECUTE FUNCTION jokko_webhook_immutable();
--> statement-breakpoint

-- 4. Analytics views (no personal data) --------------------------------------------------------
-- The reporting tool (Metabase) and the analytics role only ever read these views, on a read
-- replica. Contact details are never exposed here: consented marketing exports go through the
-- admin API, which decrypts, filters on consent and logs every export (data_exports).
CREATE SCHEMA IF NOT EXISTS analytics;
--> statement-breakpoint
CREATE VIEW analytics.users AS
  SELECT id, country, locale, display_currency, status, signup_source,
         (referred_by_user_id IS NOT NULL) AS was_referred,
         (email_verified_at IS NOT NULL) AS email_verified,
         created_at
  FROM public.users
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE VIEW analytics.marketing_consent AS
  SELECT DISTINCT ON (user_id) user_id, granted, version, created_at AS decided_at
  FROM public.consents
  WHERE type = 'marketing'
  ORDER BY user_id, created_at DESC;
--> statement-breakpoint
CREATE VIEW analytics.transactions AS
  SELECT id, user_id, network, direction, kind, asset_id, amount, fee_sponsored, status,
         source, is_spam, fiat_value_minor, fiat_currency, created_at, confirmed_at
  FROM public.transactions;
--> statement-breakpoint
CREATE VIEW analytics.ramp_sessions AS
  SELECT id, user_id, provider, direction, fiat_amount_minor, fiat_currency, asset_id,
         crypto_amount, payment_method, country, status, jokko_fee_minor, created_at, updated_at
  FROM public.ramp_sessions;
--> statement-breakpoint
CREATE VIEW analytics.swaps AS
  SELECT id, user_id, provider, from_network, to_network, from_asset_id, to_asset_id,
         from_amount, to_amount_received, jokko_fee, status, is_consolidation, created_at
  FROM public.swap_transactions;
--> statement-breakpoint
CREATE VIEW analytics.staking_positions AS
  SELECT id, user_id, network, provider, asset_id, staked, rewards, status, created_at
  FROM public.staking_positions;
--> statement-breakpoint
CREATE VIEW analytics.phone_send_invites AS
  SELECT id, sender_user_id, recipient_user_id, network, asset_id, amount, jokko_fee, status,
         expires_at, claimed_at, cancelled_at, refunded_at, created_at
  FROM public.phone_send_invites;
--> statement-breakpoint
CREATE VIEW analytics.referrals AS
  SELECT id, referrer_user_id, referee_user_id, program_version, attribution, status,
         qualified_at, eligible_at, created_at
  FROM public.referrals;
--> statement-breakpoint
CREATE VIEW analytics.fee_collections AS
  SELECT id, product, expected_amount, asset_id, expected_fiat_minor, fiat_currency, method,
         status, reconciled_at, created_at
  FROM public.fee_collections;
--> statement-breakpoint
CREATE VIEW analytics.waitlist AS
  SELECT id, product, locale, country, (user_id IS NOT NULL) AS is_user, created_at
  FROM public.waitlist_signups;
