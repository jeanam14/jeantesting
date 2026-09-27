/**
 * Compliance, integrations, engagement, fees, company wallets and configuration tables
 * (docs/04-data-model.md §4–§7, docs/09-fees-and-referrals.md).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  baseUnits,
  bytea,
  createdAt,
  encrypted,
  fiatMinor,
  idColumn,
  timestamps,
} from '../columns.js';
import {
  companyWalletPurpose,
  custodyKind,
  feeCollectionMethod,
  feeCollectionStatus,
  feeProduct,
  feeScheduleStatus,
  flagSegmentKind,
  jobStatus,
  kycStatus,
  networkKey,
  notificationChannel,
  notificationStatus,
  priceAlertDirection,
  referralStatus,
  rewardStatus,
  riskAlertStatus,
  riskSeverity,
  screeningDecision,
  waitlistProduct,
  webhookStatus,
} from './enums.js';
import { adminUsers } from './admin.js';
import { assets } from './chain.js';
import { users } from './identity.js';
import { phoneSendInvites, quotes, rampSessions, swapTransactions, transactions } from './money.js';

// === Compliance =============================================================================

/** Our user ↔ provider customer. KYC stays with the provider; we keep a status reference only. */
export const providerCustomerLinks = pgTable(
  'provider_customer_links',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    provider: text('provider').notNull(),
    providerCustomerId: text('provider_customer_id').notNull(),
    kycStatus: kycStatus('kyc_status').notNull().default('none'),
    kycLevel: text('kyc_level'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('provider_links_provider_customer_uq').on(t.provider, t.providerCustomerId),
    uniqueIndex('provider_links_user_provider_uq').on(t.userId, t.provider),
  ],
);

/** Sanctions / risk screening results (flag, don't block — except hard sanctions matches). */
export const screeningResults = pgTable(
  'screening_results',
  {
    id: idColumn(),
    address: text('address').notNull(),
    network: networkKey('network').notNull(),
    provider: text('provider').notNull(),
    riskLevel: text('risk_level').notNull(),
    categories: jsonb('categories')
      .notNull()
      .default(sql`'[]'::jsonb`),
    decision: screeningDecision('decision').notNull(),
    context: text('context').notNull(),
    userId: uuid('user_id').references(() => users.id),
    checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('screening_results_address_idx').on(t.network, t.address, t.checkedAt)],
);

/** Things compliance reviews in the admin dashboard. */
export const riskAlerts = pgTable(
  'risk_alerts',
  {
    id: idColumn(),
    userId: uuid('user_id').references(() => users.id),
    type: text('type').notNull(),
    severity: riskSeverity('severity').notNull(),
    detailsJson: jsonb('details_json').notNull(),
    status: riskAlertStatus('status').notNull().default('open'),
    assignedTo: uuid('assigned_to').references(() => adminUsers.id),
    resolution: text('resolution'),
    ...timestamps(),
  },
  (t) => [index('risk_alerts_status_idx').on(t.status, t.severity)],
);

// === Integrations ===========================================================================

/**
 * Every inbound webhook. `(provider, provider_event_id)` is unique, so a retried or duplicated
 * webhook can never be processed twice (CLAUDE.md idempotency rule). The payload may contain
 * personal data, so it is stored encrypted; `payload_sha256` proves it was not altered.
 */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: idColumn(),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    eventType: text('event_type').notNull(),
    signatureValid: boolean('signature_valid').notNull(),
    payloadEnc: encrypted('payload_enc').notNull(),
    payloadSha256: bytea('payload_sha256').notNull(),
    status: webhookStatus('status').notNull().default('received'),
    attempts: integer('attempts').notNull().default(0),
    error: text('error'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('webhook_events_provider_event_uq').on(t.provider, t.providerEventId)],
);

/** Client idempotency keys: a double-tap or retry never creates two sessions/quotes/sends. */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    key: text('key').notNull(),
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseJson: jsonb('response_json'),
    ...createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex('idempotency_keys_user_key_uq').on(t.userId, t.key)],
);

/**
 * Postgres-backed job queue and transactional outbox. Jobs are inserted in the SAME database
 * transaction as the business change that causes them, so a side effect (notification, escrow
 * refund, referral payout) is never lost and never enqueued for a rolled-back change.
 * Workers claim jobs with `FOR UPDATE SKIP LOCKED`. `dedupe_key` makes enqueueing idempotent.
 */
export const jobs = pgTable(
  'jobs',
  {
    id: idColumn(),
    queue: text('queue').notNull(),
    payload: jsonb('payload').notNull(),
    status: jobStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(8),
    runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    lastError: text('last_error'),
    dedupeKey: text('dedupe_key'),
    ...timestamps(),
  },
  (t) => [
    index('jobs_ready_idx').on(t.queue, t.status, t.runAt),
    uniqueIndex('jobs_dedupe_uq').on(t.dedupeKey),
  ],
);

/**
 * Fixed-window counters for abuse-sensitive actions (phone lookups, invites, waitlist).
 * Postgres-backed so the limit holds across every API instance (the in-memory HTTP rate limit
 * only protects one instance). Old windows are deleted by the `maintenance.cleanup` job.
 */
export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    /** `<action>:<subject>`, e.g. `phone_resolve:user:<uuid>`. Never contains raw personal data. */
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.windowStart] }),
    index('rate_limit_expiry_idx').on(t.expiresAt),
  ],
);

/** Rolling health per provider capability, for kill-switch decisions and status banners. */
export const providerHealth = pgTable(
  'provider_health',
  {
    provider: text('provider').notNull(),
    capability: text('capability').notNull(),
    status: text('status').notNull(),
    errorRateBps: integer('error_rate_bps').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.capability] })],
);

// === Engagement =============================================================================

/** In-app inbox + delivery log for every channel. */
export const notifications = pgTable(
  'notifications',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    channel: notificationChannel('channel').notNull(),
    template: text('template').notNull(),
    locale: text('locale').notNull(),
    payloadJson: jsonb('payload_json').notNull(),
    status: notificationStatus('status').notNull().default('queued'),
    providerMessageId: text('provider_message_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...createdAt(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)],
);

/** User-defined price alerts. */
export const priceAlerts = pgTable('price_alerts', {
  id: idColumn(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  assetId: text('asset_id')
    .notNull()
    .references(() => assets.id),
  direction: priceAlertDirection('direction').notNull(),
  thresholdMinor: fiatMinor('threshold_minor').notNull(),
  currency: text('currency').notNull(),
  active: boolean('active').notNull().default(true),
  ...createdAt(),
});

/** Referral programme settings (D22), versioned. Changes need two approvers. */
export const referralPrograms = pgTable(
  'referral_programs',
  {
    version: serial('version').primaryKey(),
    rewardAmount: baseUnits('reward_amount').notNull(),
    rewardAssetId: text('reward_asset_id')
      .notNull()
      .references(() => assets.id),
    refereeRewardAmount: baseUnits('referee_reward_amount'),
    minTopupMinor: fiatMinor('min_topup_minor').notNull(),
    minTopupCurrency: text('min_topup_currency').notNull(),
    qualifyWithinDays: integer('qualify_within_days').notNull(),
    holdDays: integer('hold_days').notNull(),
    maxRewardsPerReferrerPerMonth: integer('max_rewards_per_referrer_per_month').notNull(),
    /** Programme-wide daily cap, in reward asset base units. */
    dailyBudget: baseUnits('daily_budget').notNull(),
    activeFrom: timestamp('active_from', { withTimezone: true }).notNull(),
    activeTo: timestamp('active_to', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => adminUsers.id),
    approvedBy: uuid('approved_by').references(() => adminUsers.id),
    ...createdAt(),
  },
  (t) => [
    check('referral_programs_positive_ck', sql`${t.rewardAmount} > 0 and ${t.holdDays} >= 0`),
  ],
);

/** One referral code per user. */
export const referralCodes = pgTable(
  'referral_codes',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id),
    code: text('code').notNull(),
    ...createdAt(),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('referral_codes_code_uq').on(t.code)],
);

/** Who invited whom. A user can be referred only once. */
export const referrals = pgTable(
  'referrals',
  {
    id: idColumn(),
    referrerUserId: uuid('referrer_user_id')
      .notNull()
      .references(() => users.id),
    refereeUserId: uuid('referee_user_id')
      .notNull()
      .references(() => users.id),
    programVersion: integer('program_version')
      .notNull()
      .references(() => referralPrograms.version),
    attribution: text('attribution').notNull(),
    status: referralStatus('status').notNull().default('signed_up'),
    qualifyingRampSessionId: uuid('qualifying_ramp_session_id').references(() => rampSessions.id),
    rejectionReason: text('rejection_reason'),
    qualifiedAt: timestamp('qualified_at', { withTimezone: true }),
    eligibleAt: timestamp('eligible_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('referrals_referee_uq').on(t.refereeUserId),
    index('referrals_referrer_idx').on(t.referrerUserId, t.createdAt),
    check('referrals_not_self_ck', sql`${t.referrerUserId} <> ${t.refereeUserId}`),
  ],
);

/** Reward payouts from the rewards wallet. */
export const referralRewards = pgTable(
  'referral_rewards',
  {
    id: idColumn(),
    referralId: uuid('referral_id')
      .notNull()
      .references(() => referrals.id),
    beneficiaryUserId: uuid('beneficiary_user_id')
      .notNull()
      .references(() => users.id),
    amount: baseUnits('amount').notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    network: networkKey('network').notNull(),
    status: rewardStatus('status').notNull().default('scheduled'),
    txHash: text('tx_hash'),
    approvedBy: uuid('approved_by').references(() => adminUsers.id),
    ...timestamps(),
  },
  (t) => [uniqueIndex('referral_rewards_once_uq').on(t.referralId, t.beneficiaryUserId)],
);

/** Card / Business waitlists. */
export const waitlistSignups = pgTable(
  'waitlist_signups',
  {
    id: idColumn(),
    emailEnc: encrypted('email_enc').notNull(),
    emailHash: text('email_hash').notNull(),
    product: waitlistProduct('product').notNull(),
    locale: text('locale').notNull(),
    country: char('country', { length: 2 }),
    userId: uuid('user_id').references(() => users.id),
    ...createdAt(),
  },
  (t) => [uniqueIndex('waitlist_email_product_uq').on(t.emailHash, t.product)],
);

/** Home promo tiles with compliance-approved copy. */
export const promoTiles = pgTable(
  'promo_tiles',
  {
    id: idColumn(),
    key: text('key').notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    disclaimer: text('disclaimer'),
    target: text('target').notNull(),
    active: boolean('active').notNull().default(false),
    approvedBy: uuid('approved_by').references(() => adminUsers.id),
    ...timestamps(),
  },
  (t) => [uniqueIndex('promo_tiles_key_locale_uq').on(t.key, t.locale)],
);

// === Jokko fees (D17) ======================================================================

/**
 * Configurable commissions. Promotions are schedules with a segment and/or a short validity
 * window and a higher priority (no separate table). Changes require two approvers.
 */
export const feeSchedules = pgTable(
  'fee_schedules',
  {
    id: idColumn(),
    product: feeProduct('product').notNull(),
    action: text('action'),
    network: networkKey('network'),
    assetSymbol: text('asset_symbol'),
    country: char('country', { length: 2 }),
    segment: text('segment'),
    pctBps: integer('pct_bps').notNull(),
    fixedMinor: fiatMinor('fixed_minor').notNull(),
    fixedCurrency: text('fixed_currency').notNull(),
    minMinor: fiatMinor('min_minor'),
    maxMinor: fiatMinor('max_minor'),
    priority: integer('priority').notNull().default(0),
    status: feeScheduleStatus('status').notNull().default('draft'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    description: text('description'),
    createdBy: uuid('created_by').references(() => adminUsers.id),
    approvedBy: uuid('approved_by').references(() => adminUsers.id),
    ...timestamps(),
  },
  (t) => [
    index('fee_schedules_active_idx').on(t.product, t.status),
    check('fee_schedules_pct_ck', sql`${t.pctBps} between 0 and 10000`),
    check('fee_schedules_fixed_ck', sql`${t.fixedMinor} >= 0`),
    check(
      'fee_schedules_min_max_ck',
      sql`${t.minMinor} is null or ${t.maxMinor} is null or ${t.minMinor} <= ${t.maxMinor}`,
    ),
    check(
      'fee_schedules_window_ck',
      sql`${t.effectiveTo} is null or ${t.effectiveTo} > ${t.effectiveFrom}`,
    ),
    check(
      'fee_schedules_four_eyes_ck',
      sql`${t.approvedBy} is null or ${t.approvedBy} <> ${t.createdBy}`,
    ),
  ],
);

/** Every Jokko fee charged and how/when it was collected (reconciliation). */
export const feeCollections = pgTable(
  'fee_collections',
  {
    id: idColumn(),
    quoteId: uuid('quote_id').references(() => quotes.id),
    transactionId: uuid('transaction_id').references(() => transactions.id),
    rampSessionId: uuid('ramp_session_id').references(() => rampSessions.id),
    swapId: uuid('swap_id').references(() => swapTransactions.id),
    inviteId: uuid('invite_id').references(() => phoneSendInvites.id),
    product: feeProduct('product').notNull(),
    expectedAmount: baseUnits('expected_amount'),
    assetId: text('asset_id').references(() => assets.id),
    expectedFiatMinor: fiatMinor('expected_fiat_minor'),
    fiatCurrency: text('fiat_currency'),
    method: feeCollectionMethod('method').notNull(),
    status: feeCollectionStatus('status').notNull().default('expected'),
    settlementRef: text('settlement_ref'),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index('fee_collections_status_idx').on(t.status, t.createdAt)],
);

/** Jokko's own wallets. Company money only — never customer funds (CLAUDE.md rule 8). */
export const companyWallets = pgTable(
  'company_wallets',
  {
    id: idColumn(),
    purpose: companyWalletPurpose('purpose').notNull(),
    network: networkKey('network').notNull(),
    address: text('address').notNull(),
    custody: custodyKind('custody').notNull(),
    assetId: text('asset_id').references(() => assets.id),
    dailyCap: baseUnits('daily_cap'),
    active: boolean('active').notNull().default(true),
    ...createdAt(),
  },
  (t) => [uniqueIndex('company_wallets_network_address_uq').on(t.network, t.address)],
);

/** Refills and payouts of company wallets (append-only). */
export const companyWalletMovements = pgTable('company_wallet_movements', {
  id: idColumn(),
  companyWalletId: uuid('company_wallet_id')
    .notNull()
    .references(() => companyWallets.id),
  direction: text('direction').notNull(),
  amount: baseUnits('amount').notNull(),
  assetId: text('asset_id')
    .notNull()
    .references(() => assets.id),
  txHash: text('tx_hash'),
  approvedBy: uuid('approved_by').references(() => adminUsers.id),
  reason: text('reason').notNull(),
  ...createdAt(),
});

// === Configuration ==========================================================================

/** Feature flags and kill switches. */
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description').notNull(),
  owner: text('owner').notNull(),
  /** Demo-mode style flags are refused at start-up in production (D23). */
  forbiddenInProduction: boolean('forbidden_in_production').notNull().default(false),
  updatedBy: uuid('updated_by').references(() => adminUsers.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Targeting rules for a flag (all rules of a flag are OR-ed). */
export const featureFlagRules = pgTable('feature_flag_rules', {
  id: idColumn(),
  flagKey: text('flag_key')
    .notNull()
    .references(() => featureFlags.key),
  segment: flagSegmentKind('segment').notNull(),
  value: jsonb('value').notNull(),
  ...createdAt(),
});

/** Key/value configuration: minimum app version, security thresholds, copy versions, limits. */
export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  valueJson: jsonb('value_json').notNull(),
  updatedBy: uuid('updated_by').references(() => adminUsers.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
