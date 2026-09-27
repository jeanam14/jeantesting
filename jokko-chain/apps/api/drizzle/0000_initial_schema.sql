CREATE TYPE "public"."actor_type" AS ENUM('user', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('support', 'compliance', 'marketing', 'finance', 'admin');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'expired', 'executed');--> statement-breakpoint
CREATE TYPE "public"."cash_code_status" AS ENUM('pending', 'confirmed', 'expired', 'redeemed');--> statement-breakpoint
CREATE TYPE "public"."cloud_backup" AS ENUM('none', 'icloud', 'gdrive');--> statement-breakpoint
CREATE TYPE "public"."company_wallet_purpose" AS ENUM('fee_treasury', 'rewards', 'escrow_keeper', 'kora_fee_payer');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('terms', 'privacy', 'risk', 'marketing', 'contacts_sync', 'referral_terms');--> statement-breakpoint
CREATE TYPE "public"."counterparty_kind" AS ENUM('jokko_user', 'external_address', 'provider');--> statement-breakpoint
CREATE TYPE "public"."custody_kind" AS ENUM('multisig', 'kms');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TYPE "public"."fee_collection_method" AS ENUM('onchain_transfer', 'provider_partner_fee', 'lifi_integrator_fee', 'everstake_revenue_share', 'escrow_claim');--> statement-breakpoint
CREATE TYPE "public"."fee_collection_status" AS ENUM('expected', 'collected', 'reconciled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."fee_product" AS ENUM('topup', 'withdraw', 'send', 'phone_send', 'swap', 'consolidate', 'stake', 'borrow', 'card', 'cash_topup');--> statement-breakpoint
CREATE TYPE "public"."fee_schedule_status" AS ENUM('draft', 'pending_approval', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."flag_segment_kind" AS ENUM('all', 'country', 'platform', 'min_app_version', 'user_list', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'claimed', 'cancelled', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('none', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('active', 'repaid', 'liquidated', 'closed');--> statement-breakpoint
CREATE TYPE "public"."login_method" AS ENUM('sms', 'whatsapp', 'email', 'passkey');--> statement-breakpoint
CREATE TYPE "public"."network_family" AS ENUM('evm', 'solana', 'tron', 'bitcoin');--> statement-breakpoint
CREATE TYPE "public"."network_key" AS ENUM('ethereum', 'polygon', 'bsc', 'solana', 'tron', 'bitcoin');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('push', 'email', 'sms', 'whatsapp', 'inapp');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'sent', 'delivered', 'failed', 'read');--> statement-breakpoint
CREATE TYPE "public"."price_alert_direction" AS ENUM('above', 'below');--> statement-breakpoint
CREATE TYPE "public"."quote_kind" AS ENUM('ramp', 'swap', 'stake', 'send', 'phone_send');--> statement-breakpoint
CREATE TYPE "public"."ramp_direction" AS ENUM('on', 'off');--> statement-breakpoint
CREATE TYPE "public"."ramp_status" AS ENUM('created', 'awaiting_payment', 'payment_received', 'processing', 'completed', 'failed', 'expired', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('signed_up', 'qualifying', 'on_hold', 'eligible', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('scheduled', 'sent', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."risk_alert_status" AS ENUM('open', 'reviewing', 'closed');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."screening_decision" AS ENUM('allow', 'flag', 'block');--> statement-breakpoint
CREATE TYPE "public"."staking_event_kind" AS ENUM('stake', 'unstake', 'withdraw', 'reward', 'claim');--> statement-breakpoint
CREATE TYPE "public"."staking_status" AS ENUM('activating', 'active', 'unstaking', 'withdrawable', 'closed');--> statement-breakpoint
CREATE TYPE "public"."swap_status" AS ENUM('quoted', 'submitted', 'pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."tx_direction" AS ENUM('in', 'out', 'self');--> statement-breakpoint
CREATE TYPE "public"."tx_kind" AS ENUM('send', 'receive', 'swap_leg', 'stake', 'unstake', 'reward', 'approval', 'escrow_deposit', 'escrow_claim', 'escrow_refund', 'escrow_cancel', 'ramp_in', 'ramp_out', 'consolidate', 'fee', 'referral_reward');--> statement-breakpoint
CREATE TYPE "public"."tx_source" AS ENUM('app', 'indexer');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('pending', 'confirmed', 'failed', 'replaced');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'restricted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."waitlist_product" AS ENUM('card', 'business');--> statement-breakpoint
CREATE TYPE "public"."wallet_kind" AS ENUM('embedded_eoa', 'eoa_7702');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('received', 'processed', 'ignored', 'failed');--> statement-breakpoint
CREATE TABLE "admin_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"payload_json" jsonb NOT NULL,
	"requested_by" uuid NOT NULL,
	"decided_by" uuid,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "admin_approvals_four_eyes_ck" CHECK ("admin_approvals"."decided_by" is null or "admin_approvals"."decided_by" <> "admin_approvals"."requested_by")
);
--> statement-breakpoint
CREATE TABLE "admin_user_roles" (
	"admin_user_id" uuid NOT NULL,
	"role" "admin_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_user_roles_admin_user_id_role_pk" PRIMARY KEY("admin_user_id","role")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sso_subject" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_status_ck" CHECK ("admin_users"."status" in ('active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"seq" bigserial PRIMARY KEY NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"before_json" jsonb,
	"after_json" jsonb,
	"ip" text,
	"device_id" text,
	"reason" text,
	"prev_hash" "bytea",
	"hash" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_exports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"query_description" text NOT NULL,
	"filters_json" jsonb NOT NULL,
	"row_count" integer NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pii_access_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"field" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "consent_type" NOT NULL,
	"version" text NOT NULL,
	"granted" boolean NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"method" "login_method" NOT NULL,
	"ip_country" char(2),
	"is_new_device" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"incoming_tx" boolean DEFAULT true NOT NULL,
	"outgoing_tx" boolean DEFAULT true NOT NULL,
	"price_alerts" boolean DEFAULT true NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"passkey_enrolled" boolean DEFAULT false NOT NULL,
	"totp_enrolled" boolean DEFAULT false NOT NULL,
	"cloud_backup" "cloud_backup" DEFAULT 'none' NOT NULL,
	"app_lock_biometric" boolean DEFAULT false NOT NULL,
	"last_key_export_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"platform" "device_platform" NOT NULL,
	"os_version" text,
	"app_version" text,
	"attestation_status" text DEFAULT 'unverified' NOT NULL,
	"push_token_enc" "bytea",
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trusted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"privy_user_id" text NOT NULL,
	"first_name_enc" "bytea",
	"last_name_enc" "bytea",
	"phone_enc" "bytea",
	"phone_hash" text,
	"email_enc" "bytea",
	"email_hash" text,
	"email_verified_at" timestamp with time zone,
	"country" char(2),
	"locale" text DEFAULT 'fr' NOT NULL,
	"display_currency" text DEFAULT 'XOF' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"status_reason" text,
	"referred_by_user_id" uuid,
	"signup_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_locale_ck" CHECK ("users"."locale" in ('fr', 'en')),
	CONSTRAINT "users_display_currency_ck" CHECK ("users"."display_currency" in ('XOF', 'XAF', 'EUR', 'USD'))
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"network" "network_key" NOT NULL,
	"kind" text NOT NULL,
	"contract_mainnet" text,
	"contract_testnet" text,
	"decimals" integer NOT NULL,
	"is_stablecoin" boolean NOT NULL,
	"price_id" text NOT NULL,
	"review_status" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_kind_ck" CHECK ("assets"."kind" in ('native', 'token')),
	CONSTRAINT "assets_decimals_ck" CHECK ("assets"."decimals" between 0 and 36)
);
--> statement-breakpoint
CREATE TABLE "balance_snapshots" (
	"wallet_id" uuid NOT NULL,
	"asset_id" text NOT NULL,
	"balance" numeric(78, 0) NOT NULL,
	"block_ref" text,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "balance_snapshots_wallet_id_asset_id_pk" PRIMARY KEY("wallet_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "capability_overrides" (
	"network" "network_key" NOT NULL,
	"capability" text NOT NULL,
	"enabled" boolean NOT NULL,
	"reason" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "capability_overrides_network_capability_pk" PRIMARY KEY("network","capability")
);
--> statement-breakpoint
CREATE TABLE "foreign_network_detections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wallet_id" uuid NOT NULL,
	"chain_name" text NOT NULL,
	"asset_symbol" text NOT NULL,
	"raw_amount" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "networks" (
	"key" "network_key" PRIMARY KEY NOT NULL,
	"family" "network_family" NOT NULL,
	"label_fr" text NOT NULL,
	"label_en" text NOT NULL,
	"native_symbol" text NOT NULL,
	"native_decimals" integer NOT NULL,
	"supports_eip7702" boolean NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"family" "network_family" NOT NULL,
	"address" text NOT NULL,
	"privy_wallet_id" text,
	"wallet_kind" "wallet_kind" DEFAULT 'embedded_eoa' NOT NULL,
	"delegation_address" text,
	"is_pregenerated" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_topup_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"amount_minor" numeric(38, 0) NOT NULL,
	"currency" text NOT NULL,
	"status" "cash_code_status" DEFAULT 'pending' NOT NULL,
	"julaya_receipt_ref" text,
	"expires_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counterparties" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"kind" "counterparty_kind" NOT NULL,
	"linked_user_id" uuid,
	"display_name_enc" "bytea",
	"phone_hash" text,
	"provider_key" text,
	"last_activity_at" timestamp with time zone,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counterparty_addresses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"counterparty_id" uuid NOT NULL,
	"family" "network_family" NOT NULL,
	"address" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pinned_at" timestamp with time zone,
	"changed_alert_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"network" "network_key" NOT NULL,
	"collateral_asset_id" text NOT NULL,
	"borrowed_asset_id" text NOT NULL,
	"collateral_amount" numeric(78, 0) NOT NULL,
	"borrowed_amount" numeric(78, 0) NOT NULL,
	"health_factor" numeric(38, 18),
	"status" "loan_status" NOT NULL,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_send_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_phone_hash" text NOT NULL,
	"recipient_phone_enc" "bytea" NOT NULL,
	"recipient_user_id" uuid,
	"recipient_wallet_address" text NOT NULL,
	"network" "network_key" NOT NULL,
	"escrow_contract" text NOT NULL,
	"escrow_deposit_id" text,
	"asset_id" text NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"jokko_fee" numeric(78, 0) NOT NULL,
	"status" "invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claim_token_hash" text NOT NULL,
	"reminders_sent" integer DEFAULT 0 NOT NULL,
	"deposit_tx_hash" text,
	"claim_tx_hash" text,
	"refund_tx_hash" text,
	"claimed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_send_invites_amount_ck" CHECK ("phone_send_invites"."amount" > 0 and "phone_send_invites"."jokko_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "quote_kind" NOT NULL,
	"provider" text,
	"request_json" jsonb NOT NULL,
	"response_json" jsonb NOT NULL,
	"rate" numeric(38, 18),
	"fees_json" jsonb NOT NULL,
	"fee_schedule_id" uuid,
	"jokko_fee" numeric(78, 0),
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ramp_session_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ramp_session_id" uuid NOT NULL,
	"from_status" "ramp_status",
	"to_status" "ramp_status" NOT NULL,
	"webhook_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ramp_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"direction" "ramp_direction" NOT NULL,
	"provider_order_id" text,
	"fiat_amount_minor" numeric(38, 0) NOT NULL,
	"fiat_currency" text NOT NULL,
	"asset_id" text NOT NULL,
	"crypto_amount" numeric(78, 0),
	"destination_address" text,
	"provider_deposit_address" text,
	"payment_method" text NOT NULL,
	"country" char(2),
	"status" "ramp_status" DEFAULT 'created' NOT NULL,
	"failure_reason" text,
	"quote_id" uuid,
	"jokko_fee_minor" numeric(38, 0),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staking_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"position_id" uuid NOT NULL,
	"kind" "staking_event_kind" NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staking_positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"network" "network_key" NOT NULL,
	"provider" text NOT NULL,
	"validator_or_pool" text NOT NULL,
	"asset_id" text NOT NULL,
	"staked" numeric(78, 0) NOT NULL,
	"pending_unstake" numeric(78, 0) NOT NULL,
	"rewards" numeric(78, 0) NOT NULL,
	"status" "staking_status" NOT NULL,
	"unbonding_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swap_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"route_id" text,
	"from_network" "network_key" NOT NULL,
	"to_network" "network_key" NOT NULL,
	"from_asset_id" text NOT NULL,
	"to_asset_id" text NOT NULL,
	"from_amount" numeric(78, 0) NOT NULL,
	"to_amount_expected" numeric(78, 0) NOT NULL,
	"to_amount_min" numeric(78, 0) NOT NULL,
	"to_amount_received" numeric(78, 0),
	"slippage_bps" integer NOT NULL,
	"jokko_fee_bps" integer DEFAULT 0 NOT NULL,
	"jokko_fee" numeric(78, 0) NOT NULL,
	"status" "swap_status" DEFAULT 'quoted' NOT NULL,
	"source_tx_hash" text,
	"dest_tx_hash" text,
	"quote_id" uuid,
	"is_consolidation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "swap_min_le_expected_ck" CHECK ("swap_transactions"."to_amount_min" <= "swap_transactions"."to_amount_expected")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"network" "network_key" NOT NULL,
	"tx_hash" text NOT NULL,
	"event_index" integer DEFAULT 0 NOT NULL,
	"direction" "tx_direction" NOT NULL,
	"kind" "tx_kind" NOT NULL,
	"asset_id" text NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"fee_amount" numeric(78, 0),
	"fee_asset_id" text,
	"fee_sponsored" boolean DEFAULT false NOT NULL,
	"counterparty_address" text,
	"counterparty_id" uuid,
	"status" "tx_status" NOT NULL,
	"block_number" bigint,
	"confirmed_at" timestamp with time zone,
	"source" "tx_source" NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"related_type" text,
	"related_id" uuid,
	"fiat_value_minor" numeric(38, 0),
	"fiat_currency" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_amount_ck" CHECK ("transactions"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_wallet_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_wallet_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"asset_id" text NOT NULL,
	"tx_hash" text,
	"approved_by" uuid,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_wallets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"purpose" "company_wallet_purpose" NOT NULL,
	"network" "network_key" NOT NULL,
	"address" text NOT NULL,
	"custody" "custody_kind" NOT NULL,
	"asset_id" text,
	"daily_cap" numeric(78, 0),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"flag_key" text NOT NULL,
	"segment" "flag_segment_kind" NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"owner" text NOT NULL,
	"forbidden_in_production" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quote_id" uuid,
	"transaction_id" uuid,
	"ramp_session_id" uuid,
	"swap_id" uuid,
	"invite_id" uuid,
	"product" "fee_product" NOT NULL,
	"expected_amount" numeric(78, 0),
	"asset_id" text,
	"expected_fiat_minor" numeric(38, 0),
	"fiat_currency" text,
	"method" "fee_collection_method" NOT NULL,
	"status" "fee_collection_status" DEFAULT 'expected' NOT NULL,
	"settlement_ref" text,
	"reconciled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product" "fee_product" NOT NULL,
	"action" text,
	"network" "network_key",
	"asset_symbol" text,
	"country" char(2),
	"segment" text,
	"pct_bps" integer NOT NULL,
	"fixed_minor" numeric(38, 0) NOT NULL,
	"fixed_currency" text NOT NULL,
	"min_minor" numeric(38, 0),
	"max_minor" numeric(38, 0),
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "fee_schedule_status" DEFAULT 'draft' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"description" text,
	"created_by" uuid,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_schedules_pct_ck" CHECK ("fee_schedules"."pct_bps" between 0 and 10000),
	CONSTRAINT "fee_schedules_fixed_ck" CHECK ("fee_schedules"."fixed_minor" >= 0),
	CONSTRAINT "fee_schedules_min_max_ck" CHECK ("fee_schedules"."min_minor" is null or "fee_schedules"."max_minor" is null or "fee_schedules"."min_minor" <= "fee_schedules"."max_minor"),
	CONSTRAINT "fee_schedules_window_ck" CHECK ("fee_schedules"."effective_to" is null or "fee_schedules"."effective_to" > "fee_schedules"."effective_from"),
	CONSTRAINT "fee_schedules_four_eyes_ck" CHECK ("fee_schedules"."approved_by" is null or "fee_schedules"."approved_by" <> "fee_schedules"."created_by")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_status" integer,
	"response_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"template" text NOT NULL,
	"locale" text NOT NULL,
	"payload_json" jsonb NOT NULL,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"provider_message_id" text,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" text NOT NULL,
	"direction" "price_alert_direction" NOT NULL,
	"threshold_minor" numeric(38, 0) NOT NULL,
	"currency" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_tiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"disclaimer" text,
	"target" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_customer_links" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'none' NOT NULL,
	"kyc_level" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_health" (
	"provider" text NOT NULL,
	"capability" text NOT NULL,
	"status" text NOT NULL,
	"error_rate_bps" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_health_provider_capability_pk" PRIMARY KEY("provider","capability")
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referral_programs" (
	"version" serial PRIMARY KEY NOT NULL,
	"reward_amount" numeric(78, 0) NOT NULL,
	"reward_asset_id" text NOT NULL,
	"referee_reward_amount" numeric(78, 0),
	"min_topup_minor" numeric(38, 0) NOT NULL,
	"min_topup_currency" text NOT NULL,
	"qualify_within_days" integer NOT NULL,
	"hold_days" integer NOT NULL,
	"max_rewards_per_referrer_per_month" integer NOT NULL,
	"daily_budget" numeric(78, 0) NOT NULL,
	"active_from" timestamp with time zone NOT NULL,
	"active_to" timestamp with time zone,
	"created_by" uuid,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_programs_positive_ck" CHECK ("referral_programs"."reward_amount" > 0 and "referral_programs"."hold_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"referral_id" uuid NOT NULL,
	"beneficiary_user_id" uuid NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"asset_id" text NOT NULL,
	"network" "network_key" NOT NULL,
	"status" "reward_status" DEFAULT 'scheduled' NOT NULL,
	"tx_hash" text,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referee_user_id" uuid NOT NULL,
	"program_version" integer NOT NULL,
	"attribution" text NOT NULL,
	"status" "referral_status" DEFAULT 'signed_up' NOT NULL,
	"qualifying_ramp_session_id" uuid,
	"rejection_reason" text,
	"qualified_at" timestamp with time zone,
	"eligible_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_not_self_ck" CHECK ("referrals"."referrer_user_id" <> "referrals"."referee_user_id")
);
--> statement-breakpoint
CREATE TABLE "risk_alerts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"severity" "risk_severity" NOT NULL,
	"details_json" jsonb NOT NULL,
	"status" "risk_alert_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"network" "network_key" NOT NULL,
	"provider" text NOT NULL,
	"risk_level" text NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decision" "screening_decision" NOT NULL,
	"context" text NOT NULL,
	"user_id" uuid,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email_enc" "bytea" NOT NULL,
	"email_hash" text NOT NULL,
	"product" "waitlist_product" NOT NULL,
	"locale" text NOT NULL,
	"country" char(2),
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"signature_valid" boolean NOT NULL,
	"payload_enc" "bytea" NOT NULL,
	"payload_sha256" "bytea" NOT NULL,
	"status" "webhook_status" DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_approvals" ADD CONSTRAINT "admin_approvals_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_approvals" ADD CONSTRAINT "admin_approvals_decided_by_admin_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pii_access_log" ADD CONSTRAINT "pii_access_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_settings" ADD CONSTRAINT "security_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_network_networks_key_fk" FOREIGN KEY ("network") REFERENCES "public"."networks"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_snapshots" ADD CONSTRAINT "balance_snapshots_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_overrides" ADD CONSTRAINT "capability_overrides_network_networks_key_fk" FOREIGN KEY ("network") REFERENCES "public"."networks"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_overrides" ADD CONSTRAINT "capability_overrides_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foreign_network_detections" ADD CONSTRAINT "foreign_network_detections_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_topup_codes" ADD CONSTRAINT "cash_topup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_linked_user_id_users_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparty_addresses" ADD CONSTRAINT "counterparty_addresses_counterparty_id_counterparties_id_fk" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_collateral_asset_id_assets_id_fk" FOREIGN KEY ("collateral_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrowed_asset_id_assets_id_fk" FOREIGN KEY ("borrowed_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_send_invites" ADD CONSTRAINT "phone_send_invites_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_send_invites" ADD CONSTRAINT "phone_send_invites_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_send_invites" ADD CONSTRAINT "phone_send_invites_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramp_session_events" ADD CONSTRAINT "ramp_session_events_ramp_session_id_ramp_sessions_id_fk" FOREIGN KEY ("ramp_session_id") REFERENCES "public"."ramp_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramp_sessions" ADD CONSTRAINT "ramp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramp_sessions" ADD CONSTRAINT "ramp_sessions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ramp_sessions" ADD CONSTRAINT "ramp_sessions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staking_events" ADD CONSTRAINT "staking_events_position_id_staking_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."staking_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staking_positions" ADD CONSTRAINT "staking_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staking_positions" ADD CONSTRAINT "staking_positions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_from_asset_id_assets_id_fk" FOREIGN KEY ("from_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_to_asset_id_assets_id_fk" FOREIGN KEY ("to_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_asset_id_assets_id_fk" FOREIGN KEY ("fee_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_counterparty_id_counterparties_id_fk" FOREIGN KEY ("counterparty_id") REFERENCES "public"."counterparties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_wallet_movements" ADD CONSTRAINT "company_wallet_movements_company_wallet_id_company_wallets_id_fk" FOREIGN KEY ("company_wallet_id") REFERENCES "public"."company_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_wallet_movements" ADD CONSTRAINT "company_wallet_movements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_wallet_movements" ADD CONSTRAINT "company_wallet_movements_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_wallets" ADD CONSTRAINT "company_wallets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_rules" ADD CONSTRAINT "feature_flag_rules_flag_key_feature_flags_key_fk" FOREIGN KEY ("flag_key") REFERENCES "public"."feature_flags"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_ramp_session_id_ramp_sessions_id_fk" FOREIGN KEY ("ramp_session_id") REFERENCES "public"."ramp_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_swap_id_swap_transactions_id_fk" FOREIGN KEY ("swap_id") REFERENCES "public"."swap_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_invite_id_phone_send_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."phone_send_invites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_collections" ADD CONSTRAINT "fee_collections_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedules" ADD CONSTRAINT "fee_schedules_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedules" ADD CONSTRAINT "fee_schedules_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_tiles" ADD CONSTRAINT "promo_tiles_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_customer_links" ADD CONSTRAINT "provider_customer_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_reward_asset_id_assets_id_fk" FOREIGN KEY ("reward_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_beneficiary_user_id_users_id_fk" FOREIGN KEY ("beneficiary_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_user_id_users_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_program_version_referral_programs_version_fk" FOREIGN KEY ("program_version") REFERENCES "public"."referral_programs"("version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_qualifying_ramp_session_id_ramp_sessions_id_fk" FOREIGN KEY ("qualifying_ramp_session_id") REFERENCES "public"."ramp_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_assigned_to_admin_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_signups" ADD CONSTRAINT "waitlist_signups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_approvals_status_idx" ON "admin_approvals" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_sso_subject_uq" ON "admin_users" USING btree ("sso_subject");--> statement-breakpoint
CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "consents_user_type_idx" ON "consents" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "login_events_user_idx" ON "login_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_devices_user_device_uq" ON "user_devices" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_privy_user_id_uq" ON "users" USING btree ("privy_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_hash_uq" ON "users" USING btree ("phone_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_hash_uq" ON "users" USING btree ("email_hash");--> statement-breakpoint
CREATE INDEX "foreign_detections_wallet_idx" ON "foreign_network_detections" USING btree ("wallet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_family_address_uq" ON "wallets" USING btree ("family","address");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_user_family_uq" ON "wallets" USING btree ("user_id","family");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_topup_codes_code_uq" ON "cash_topup_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_topup_codes_receipt_uq" ON "cash_topup_codes" USING btree ("julaya_receipt_ref");--> statement-breakpoint
CREATE INDEX "counterparties_owner_activity_idx" ON "counterparties" USING btree ("owner_user_id","last_activity_at");--> statement-breakpoint
CREATE UNIQUE INDEX "counterparties_owner_linked_uq" ON "counterparties" USING btree ("owner_user_id","linked_user_id") WHERE "counterparties"."linked_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "counterparty_addresses_uq" ON "counterparty_addresses" USING btree ("counterparty_id","family","address");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_send_invites_claim_token_uq" ON "phone_send_invites" USING btree ("claim_token_hash");--> statement-breakpoint
CREATE INDEX "phone_send_invites_status_expiry_idx" ON "phone_send_invites" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "phone_send_invites_recipient_idx" ON "phone_send_invites" USING btree ("recipient_phone_hash","status");--> statement-breakpoint
CREATE INDEX "quotes_user_idx" ON "quotes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ramp_session_events_session_idx" ON "ramp_session_events" USING btree ("ramp_session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ramp_sessions_provider_order_uq" ON "ramp_sessions" USING btree ("provider","provider_order_id");--> statement-breakpoint
CREATE INDEX "ramp_sessions_user_idx" ON "ramp_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ramp_sessions_status_idx" ON "ramp_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staking_positions_user_idx" ON "staking_positions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "swap_transactions_user_idx" ON "swap_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_event_uq" ON "transactions" USING btree ("network","tx_hash","event_index","wallet_id");--> statement-breakpoint
CREATE INDEX "transactions_user_created_idx" ON "transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_counterparty_idx" ON "transactions" USING btree ("counterparty_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_wallets_network_address_uq" ON "company_wallets" USING btree ("network","address");--> statement-breakpoint
CREATE INDEX "fee_collections_status_idx" ON "fee_collections" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "fee_schedules_active_idx" ON "fee_schedules" USING btree ("product","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_user_key_uq" ON "idempotency_keys" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "jobs_ready_idx" ON "jobs" USING btree ("queue","status","run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_dedupe_uq" ON "jobs" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_tiles_key_locale_uq" ON "promo_tiles" USING btree ("key","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_links_provider_customer_uq" ON "provider_customer_links" USING btree ("provider","provider_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_links_user_provider_uq" ON "provider_customer_links" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_codes_code_uq" ON "referral_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_rewards_once_uq" ON "referral_rewards" USING btree ("referral_id","beneficiary_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referee_uq" ON "referrals" USING btree ("referee_user_id");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_user_id","created_at");--> statement-breakpoint
CREATE INDEX "risk_alerts_status_idx" ON "risk_alerts" USING btree ("status","severity");--> statement-breakpoint
CREATE INDEX "screening_results_address_idx" ON "screening_results" USING btree ("network","address","checked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_email_product_uq" ON "waitlist_signups" USING btree ("email_hash","product");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_uq" ON "webhook_events" USING btree ("provider","provider_event_id");