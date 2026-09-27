# Data model

Status: **implemented (2026-09-27, D24)**. It replaces the "Suggested DB tables" list in
`CLAUDE.md`.

- **Source of truth** for exact columns, types and constraints: the Drizzle schema in
  `apps/api/src/database/schema/`.
- **Migrations:** `apps/api/drizzle/` (`0000` schema, `0001` security hardening, `0002`
  rate-limit buckets).
- **Tests:** `apps/api/test/database/schema.test.ts`.
- **Scope of this doc:** each table's purpose and its important columns.

**Differences from the original plan** (decided while building; each is marked in the tables
below):

| Planned | Implemented | Why |
|---|---|---|
| `chains` | `networks` | Mirror of the `@jokko/core` registry, upserted by the seed. The code registry is the source of truth. |
| `chain_capabilities` | Static map in `@jokko/core` + `capability_overrides` | The code defines the maximum; the table can only switch things **off** (kill switch). |
| `limits` | Keys in `app_config` (`security_thresholds_xof`, `phone_send_invite_limits_xof`, `phone_send_invite_ttl_hours`) | Same review and audit path as other runtime settings. |
| `outbox_events` + Redis/BullMQ | `jobs`: job queue and outbox in one Postgres table | A job exists only if the change that caused it committed. **Differs from D18: founder sign-off pending** (`docs/HANDOFF.md` §4). |
| `fee_promotions` | Rows in `fee_schedules` with a `segment`, a short validity window and a higher `priority` | One matching engine, no second source of rules. |
| `admin_roles` | Role enum on `admin_user_roles` | Roles are a fixed list; no separate table needed. |
| — | `rate_limit_buckets` (new) | Abuse limits shared by all API instances (phone-number lookups, invites, waitlist). |
| Fiat `NUMERIC(24,8)` | Fiat in integer **minor units**, `NUMERIC(38,0)` (FCFA francs, cents) | No fractional rounding anywhere. Rates are `NUMERIC(38,18)`. |
| Roles `app_rw`, `worker_rw`, `admin_ro`/`admin_rw`, `analytics_ro` | `jokko_api`, `jokko_worker`, `jokko_admin_api`, `jokko_analytics` | See `apps/api/src/database/sql/roles-and-grants.sql`. |

## Conventions (apply to every table)

- **IDs:** UUIDv7 (time-ordered). Never expose sequential IDs.
- **Timestamps:** `created_at`, `updated_at` as `timestamptz` (UTC). Soft delete via
  `deleted_at` where the law requires retention.
- **Chain amounts:** `NUMERIC(78,0)` in base units + an `asset_id` reference (decimals live on
  the asset). **Never float.**
- **Fiat amounts:** integer minor units, `NUMERIC(38,0)` + ISO 4217 `currency` (XOF/XAF have
  0 decimals, so 1 unit = 1 franc). Rates: `NUMERIC(38,18)`, kept as exact strings in code.
- **Personal data** (phone, email, names): encrypted at field level (AWS KMS envelope
  encryption) + a keyed hash column (HMAC) for exact-match lookups. The plain value never sits
  in the database unencrypted.
- **Append-only tables** (`audit_log`, `consents`, `login_events`, `*_events`,
  `pii_access_log`, `data_exports`, `company_wallet_movements`): database triggers reject
  UPDATE, DELETE and TRUNCATE, and the grants script removes those rights too. `audit_log` is
  hash-chained (`jokko_audit_verify()`). In `webhook_events`, the payload and its hash can never
  change; only the processing status moves forward.
- **Status columns** use Postgres enums and a forward-only state machine enforced in code.
- **Database roles:** `jokko_api` (public API), `jokko_admin_api` (staff API), `jokko_worker`,
  `jokko_analytics` (views in the `analytics` schema only, no personal data), plus a migrator
  role that owns the schema.
- **Retention:** counsel sets retention periods (the AML law requires keeping transaction
  records for several years). Deletion requests anonymise personal data but keep the
  transaction records required by law.

## 1. Identity and access

| Table | Purpose | Key columns |
|---|---|---|
| `users` | One row per person | `privy_user_id` (unique), `first_name_enc`, `last_name_enc`, `phone_enc`, `phone_hash`, `email_enc`, `email_hash`, `email_verified_at`, `country`, `locale` (fr/en), `display_currency` (XOF default), `status` (active / restricted / closed), `security_level` (1–3), `referral_code`, `referred_by_user_id`, `signup_source` |
| `user_devices` | Each installed app instance | `user_id`, `device_id` (random, generated on install), `platform`, `os_version`, `app_version`, `attestation_status`, `push_token_enc`, `first_seen_at`, `last_seen_at`, `trusted_at`, `revoked_at` |
| `login_events` | Security history | `user_id`, `device_id`, `method` (sms / whatsapp / email / passkey), `ip_country`, `is_new_device`, `created_at` |
| `security_settings` | What's enabled | `user_id`, `passkey_enrolled`, `totp_enrolled`, `cloud_backup` (none / icloud / gdrive), `app_lock_biometric`, `last_key_export_at` |
| `consents` | Legal record (append-only) | `user_id`, `type` (terms / privacy / risk / marketing / contacts_sync), `version`, `granted` (bool), `created_at`, `source` |
| `notification_preferences` | Settings toggles | `user_id`, `incoming_tx`, `outgoing_tx`, `price_alerts`, `marketing` (mirrors the marketing consent). Security alerts are not stored because they are always on |

## 2. Chains, assets and wallets

| Table | Purpose | Key columns |
|---|---|---|
| `networks` (planned as `chains`) | Supported networks, mirrored from `@jokko/core` by the seed | `key` (ethereum / polygon / bsc / solana / tron / bitcoin), `family` (evm / solana / tron / bitcoin), `label_fr`, `label_en`, `native_symbol`, `native_decimals`, `supports_eip7702` |
| `assets` | Curated token allowlist (P7), mirrored from `@jokko/core` by the seed | `id` (e.g. `usdc:polygon`), `symbol`, `name`, `network`, `kind` (native / token), `contract_mainnet`, `contract_testnet`, `decimals`, `is_stablecoin`, `price_id`, `review_status` (mainnet refuses tokens not `reviewed`) |
| `capability_overrides` (planned as `chain_capabilities`) | Kill switches. The maximum is the static map in `@jokko/core`; this table can only switch a capability off | `network`, `capability` (send / receive / swap / stake / borrow / phoneSend / gasless / cardSpend / rampOn / rampOff), `enabled`, `reason`, `updated_by` |
| `wallets` | User addresses (one per network family; one wallet per user at launch, P17) | `user_id`, `family` (evm / solana / tron / bitcoin), `address` (unique per family), `privy_wallet_id`, `wallet_kind` (embedded_eoa / eoa_7702), `delegation_address` (7702 delegate, pinned), `is_pregenerated`, `claimed_at` |
| `balance_snapshots` | Cache for display and reporting, **never for send decisions** | `wallet_id`, `asset_id`, `balance_base_units`, `block_ref`, `observed_at` |
| `foreign_network_detections` | Wrong-network safety net (`01` §7) | `wallet_id`, `chain_key` (e.g. bsc), `asset_symbol`, `amount_base_units`, `detected_at`, `resolved_at` |

## 3. Money movement

| Table | Purpose | Key columns |
|---|---|---|
| `transactions` | **Every on-chain movement**, the backbone of History and chat threads | `user_id`, `wallet_id`, `chain_key`, `tx_hash`, `log_index`/`vout` (unique together), `direction` (in / out / self), `kind` (send / receive / swap_leg / stake / unstake / reward / approval / escrow_deposit / escrow_claim / escrow_refund / ramp_in / ramp_out / consolidate), `asset_id`, `amount_base_units`, `fee_base_units`, `fee_asset_id`, `fee_sponsored` (bool), `counterparty_address`, `counterparty_id`, `status` (pending / confirmed / failed / replaced), `block_number`, `confirmed_at`, `source` (app / indexer), `is_spam` (bool), `related_type` + `related_id` (link to ramp / swap / stake / invite), `fiat_value_at_time` + `fiat_currency` |
| `counterparties` | Who a user transacts with → one row per thread | `owner_user_id`, `kind` (jokko_user / external_address / provider), `linked_user_id`, `display_name_enc`, `phone_hash`, `last_activity_at`, `pinned` |
| `counterparty_addresses` | Addresses per counterparty + pinning (T3) | `counterparty_id`, `family`, `address`, `first_seen_at`, `pinned_at`, `changed_alert_at` |
| `phone_send_invites` | Phone sends to non-users (escrow, P2) | `sender_user_id`, `recipient_phone_hash`, `recipient_phone_enc`, `recipient_wallet_id` (pregenerated), `chain_key`, `escrow_contract`, `escrow_deposit_id`, `asset_id`, `amount_base_units`, `jokko_fee_base_units` (paid to Jokko only on claim), `status` (pending / claimed / cancelled / refunded / failed), `expires_at`, `claim_token_hash`, `reminders_sent`, `claimed_at`, `cancelled_at`, `refunded_at` |
| `quotes` | Exactly what the user was shown (disputes, audits) | `user_id`, `kind` (ramp / swap / stake / send_fee), `provider`, `request_json`, `response_json`, `rate`, `fees_json`, `expires_at`, `accepted_at` |
| `ramp_sessions` | Top-up / withdrawal with IvoryPay, Fonbnk, Bridge, card on-ramp | `user_id`, `provider`, `direction` (on / off), `provider_order_id` (unique per provider), `fiat_amount`, `fiat_currency`, `crypto_asset_id`, `crypto_amount_base_units`, `destination_address` (from device, T3), `payment_method` (orange_money / wave / mtn / card / bank…), `country`, `status`, `failure_reason`, `quote_id` |
| `ramp_session_events` | Status history (append-only) | `ramp_session_id`, `from_status`, `to_status`, `webhook_event_id`, `created_at` |
| `swap_transactions` | LI.FI swaps (same-chain + cross-chain) + consolidations | `user_id`, `provider` (lifi), `route_id`, `from_chain`, `to_chain`, `from_asset_id`, `to_asset_id`, `from_amount`, `to_amount_expected`, `to_amount_min`, `to_amount_received`, `slippage_bps`, `jokko_fee_bps`, `status`, `source_tx_hash`, `dest_tx_hash`, `quote_id` |
| `staking_positions` | Everstake positions | `user_id`, `chain_key`, `provider` (everstake), `validator_or_pool`, `staked_base_units`, `pending_unstake_base_units`, `rewards_base_units`, `status` (activating / active / unstaking / withdrawable / closed), `unbonding_ends_at` |
| `staking_events` | Stake / unstake / claim history | `position_id`, `kind`, `amount_base_units`, `tx_id` |
| `loans` | **Later (after launch)**: Aave V3 | `user_id`, `chain_key`, `collateral_asset_id`, `borrowed_asset_id`, `health_factor`, `status`, `last_checked_at` |
| `cash_topup_codes` | **Later**: Julaya (per spec) | `user_id`, `code_hash` (unique), `amount`, `currency`, `status` (pending / confirmed / expired / redeemed), `julaya_receipt_ref` (unique), `expires_at`, `confirmed_at` |

## 4. Compliance and risk

| Table | Purpose | Key columns |
|---|---|---|
| `provider_customer_links` | Our user ↔ provider customer (KYC stays with the provider) | `user_id`, `provider`, `provider_customer_id`, `kyc_status` (none / pending / approved / rejected — a status reference only, no documents), `kyc_level`, `updated_at` |
| `screening_results` | Sanctions / risk checks | `address`, `chain_key`, `provider`, `risk_level`, `categories`, `decision` (allow / flag / block), `checked_at`, `context` (send / receive / invite) |
| `risk_alerts` | Things compliance reviews | `user_id`, `type`, `severity`, `details_json`, `status` (open / reviewing / closed), `assigned_to`, `resolution` |
| _(planned `limits`)_ | Thresholds and invite caps live in `app_config` instead | `security_thresholds_xof`, `phone_send_invite_limits_xof`, `phone_send_invite_ttl_hours` |

## 5. Integrations and reliability

| Table | Purpose | Key columns |
|---|---|---|
| `webhook_events` | Every inbound webhook (append-only, idempotency) | `provider`, `provider_event_id` (**unique with provider**), `signature_valid`, `payload_enc`, `received_at`, `processed_at`, `status`, `attempts`, `error` |
| `idempotency_keys` | Prevent double-creation from retries / double-taps | `user_id`, `key` (unique per user), `request_hash`, `response_json`, `expires_at` |
| `jobs` (replaces planned `outbox_events` + BullMQ) | Job queue and transactional outbox: inserted in the same transaction as the change that causes it; workers claim with `FOR UPDATE SKIP LOCKED`, retry with backoff, then `dead` | `queue`, `payload`, `status` (pending / running / succeeded / failed / dead), `attempts`, `max_attempts`, `run_at`, `locked_at`, `locked_by`, `dedupe_key` (unique), `last_error` |
| `rate_limit_buckets` | Per-user abuse limits shared by all API instances | `key` (`<action>:<subject>`, never raw personal data), `window_start`, `count`, `expires_at` |
| `provider_health` | Per provider/capability health for kill-switch decisions | `provider`, `capability`, `status`, `error_rate`, `updated_at` |

## 6. Notifications and engagement

| Table | Purpose | Key columns |
|---|---|---|
| `notifications` | In-app inbox + delivery log | `user_id`, `channel` (push / email / sms / whatsapp / inapp), `template`, `locale`, `payload_json`, `status`, `provider_message_id`, `sent_at`, `read_at` |
| `price_alerts` | User-defined alerts | `user_id`, `asset_id`, `direction` (above / below), `threshold`, `currency`, `active` |
| `referral_programs` | Programme settings (versioned; changes need two approvers) | `version`, `reward_amount`, `reward_asset_id`, `reward_chain_key`, `referee_reward_amount` (optional), `min_topup_amount` + `currency`, `qualify_within_days`, `hold_days`, `max_rewards_per_referrer_per_month`, `daily_budget`, `active_from`, `active_to` |
| `referral_codes` | One code per user | `user_id` (unique), `code` (unique, human-friendly), `created_at`, `disabled_at` |
| `referrals` | Who invited whom (D22) | `referrer_user_id`, `referee_user_id` (unique), `program_version`, `attribution` (link / code / install_referrer), `status` (signed_up / qualifying_topup / on_hold / eligible / paid / rejected), `qualifying_ramp_session_id`, `rejection_reason`, `created_at` |
| `referral_rewards` | Payouts | `referral_id`, `beneficiary_user_id`, `amount_base_units`, `asset_id`, `chain_key`, `status` (scheduled / sent / confirmed / failed), `tx_hash`, `approved_by` (if manual review) |
| `waitlist_signups` | Card / Business (per spec) | `email_enc`, `email_hash`, `product_interest` (card / business), `locale`, `country`, `user_id` (nullable), `created_at` |
| `promo_tiles` | Static home tiles (staking promo, swap promo) with approved copy | `key`, `locale`, `title`, `body`, `disclaimer`, `target`, `active`, `approved_by` |

## 6b. Jokko fees (D17, `09-fees-and-referrals.md`)

| Table | Purpose | Key columns |
|---|---|---|
| `fee_schedules` | Configurable commissions (versioned; changes need two approvers) | `product` (topup / withdraw / send / phone_send / swap / consolidate / stake / borrow / card / cash_topup), `action`, `chain_key` (nullable), `asset_id` (nullable), `country` (nullable), `segment` (nullable), `pct_bps`, `fixed_amount`, `fixed_currency`, `min_amount`, `max_amount`, `priority`, `status` (draft / pending_approval / active / retired), `effective_from`, `effective_to`, `created_by`, `approved_by` |
| _(planned `fee_promotions`)_ | Promotions are `fee_schedules` rows with a `segment` and/or short validity window and a higher `priority` | — |
| `fee_collections` | Every fee charged and how it was collected | `quote_id`, `transaction_id` / `ramp_session_id` / `swap_id`, `product`, `expected_amount`, `asset_id` or `fiat_currency`, `method` (onchain_transfer / provider_partner_fee / lifi_integrator_fee / everstake_revenue_share / escrow_claim), `status` (expected / collected / reconciled / disputed), `settlement_ref`, `reconciled_at` |
| `company_wallets` | Jokko's own wallets (company money, never customer funds) | `purpose` (fee_treasury / rewards / escrow_keeper / kora_fee_payer), `chain_key`, `address`, `custody` (multisig / kms), `daily_cap` |
| `company_wallet_movements` | Refills and payouts of company wallets | `company_wallet_id`, `direction`, `amount_base_units`, `asset_id`, `tx_hash`, `approved_by`, `reason` |

## 7. Configuration

| Table | Purpose | Key columns |
|---|---|---|
| `feature_flags` | Flags + kill switches | `key`, `enabled`, `description`, `owner` |
| `feature_flag_rules` | Targeting | `flag_key`, `segment` (country / platform / app_version / user list / percentage), `value` |
| `app_config` | Minimum app version, thresholds, copy versions | `key`, `value_json`, `updated_by` |

## 8. Admin and audit

| Table | Purpose | Key columns |
|---|---|---|
| `admin_users` | Staff accounts (via SSO) | `sso_subject`, `email`, `status`, `last_login_at` |
| `admin_user_roles` (planned with a separate `admin_roles` table) | Role-based access; roles are a fixed enum, so no roles table is needed | `admin_user_id`, `role` (support / compliance / marketing / finance / admin) |
| `admin_approvals` | Four-eyes requests | `action`, `target`, `requested_by`, `approved_by`, `status`, `payload_json` |
| `audit_log` | **Every** sensitive action by users, staff and the system (append-only, hash-chained) | `actor_type` (user / admin / system), `actor_id`, `action`, `target_type`, `target_id`, `before_json`, `after_json`, `ip`, `device_id`, `reason`, `prev_hash`, `hash`, `created_at` |
| `pii_access_log` | Who revealed which personal data | `admin_user_id`, `user_id`, `field`, `reason`, `created_at` |
| `data_exports` | Who exported which list | `admin_user_id`, `query_description`, `filters_json`, `row_count`, `purpose`, `created_at` |

## 9. What we deliberately do **not** store

- Private keys, seed phrases, key shares, the app passcode (all stay with the user / Privy).
- KYC documents, selfies, ID numbers (the providers keep them).
- Full contact books. If contact matching is added later, only keyed hashes of phone numbers
  are sent, with a separate consent (`consents.type = contacts_sync`).
