-- ============================================================================================
-- Database roles and privileges (least privilege, docs/04-data-model.md "Database roles").
--
-- NOT a migration: roles are cluster-level objects created by infrastructure (Terraform) with
-- an administrative connection, once per environment. Passwords come from the secret manager
-- (placeholders below are replaced by the provisioning script, never committed).
--
--   jokko_migrator   owns the schema; used only by the migration step in CI/CD
--   jokko_api        public mobile API
--   jokko_admin_api  private admin API (staff)
--   jokko_worker     background jobs
--   jokko_analytics  reporting (Metabase), read replica, analytics views only
-- ============================================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jokko_api') THEN
    CREATE ROLE jokko_api LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jokko_admin_api') THEN
    CREATE ROLE jokko_admin_api LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jokko_worker') THEN
    CREATE ROLE jokko_worker LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jokko_analytics') THEN
    CREATE ROLE jokko_analytics LOGIN;
  END IF;
END;
$$;

-- Nobody but the migrator can create objects.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Application roles: read/write data, but never schema changes.
GRANT USAGE ON SCHEMA public TO jokko_api, jokko_admin_api, jokko_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO jokko_api, jokko_admin_api, jokko_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO jokko_api, jokko_admin_api, jokko_worker;

-- Append-only tables: INSERT and SELECT only (the triggers enforce this too — defence in depth).
REVOKE UPDATE, DELETE, TRUNCATE ON
  audit_log, consents, login_events, ramp_session_events, staking_events,
  pii_access_log, data_exports, company_wallet_movements
FROM jokko_api, jokko_admin_api, jokko_worker;

-- The public API never touches staff tables or fee configuration.
REVOKE ALL ON admin_users, admin_user_roles, admin_approvals, pii_access_log, data_exports
FROM jokko_api;
REVOKE INSERT, UPDATE, DELETE ON fee_schedules, referral_programs, feature_flags,
  feature_flag_rules, app_config, capability_overrides, company_wallets
FROM jokko_api;

-- Analytics: views only, no base tables, no personal data.
GRANT USAGE ON SCHEMA analytics TO jokko_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO jokko_analytics;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM jokko_analytics;
