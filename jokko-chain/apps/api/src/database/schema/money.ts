/**
 * Money movement tables (docs/04-data-model.md §3). The blockchain is the source of truth for
 * balances; these tables index what happened for history, threads, reporting and support.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  baseUnits,
  createdAt,
  encrypted,
  fiatMinor,
  idColumn,
  rate,
  timestamps,
} from '../columns.js';
import {
  cashCodeStatus,
  counterpartyKind,
  inviteStatus,
  loanStatus,
  networkFamily,
  networkKey,
  quoteKind,
  rampDirection,
  rampStatus,
  stakingEventKind,
  stakingStatus,
  swapStatus,
  txDirection,
  txKind,
  txSource,
  txStatus,
} from './enums.js';
import { assets, wallets } from './chain.js';
import { users } from './identity.js';

/** Who a user transacts with: one row per conversation thread. */
export const counterparties = pgTable(
  'counterparties',
  {
    id: idColumn(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id),
    kind: counterpartyKind('kind').notNull(),
    linkedUserId: uuid('linked_user_id').references(() => users.id),
    displayNameEnc: encrypted('display_name_enc'),
    phoneHash: text('phone_hash'),
    /** For `provider` counterparties (e.g. `orange_money`). */
    providerKey: text('provider_key'),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    pinned: boolean('pinned').notNull().default(false),
    ...createdAt(),
  },
  (t) => [
    index('counterparties_owner_activity_idx').on(t.ownerUserId, t.lastActivityAt),
    uniqueIndex('counterparties_owner_linked_uq')
      .on(t.ownerUserId, t.linkedUserId)
      .where(sql`${t.linkedUserId} is not null`),
  ],
);

/** Addresses seen per counterparty; `pinned_at` supports address pinning (T3). */
export const counterpartyAddresses = pgTable(
  'counterparty_addresses',
  {
    id: idColumn(),
    counterpartyId: uuid('counterparty_id')
      .notNull()
      .references(() => counterparties.id),
    family: networkFamily('family').notNull(),
    address: text('address').notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    pinnedAt: timestamp('pinned_at', { withTimezone: true }),
    changedAlertAt: timestamp('changed_alert_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('counterparty_addresses_uq').on(t.counterpartyId, t.family, t.address)],
);

/**
 * Every on-chain movement affecting a user: the backbone of History and payment threads.
 * The same transaction appears once per Jokko wallet it touches (sender and recipient rows).
 */
export const transactions = pgTable(
  'transactions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id),
    network: networkKey('network').notNull(),
    txHash: text('tx_hash').notNull(),
    /** Log index (EVM/Tron transfers), instruction index (Solana) or output index (Bitcoin). */
    eventIndex: integer('event_index').notNull().default(0),
    direction: txDirection('direction').notNull(),
    kind: txKind('kind').notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    amount: baseUnits('amount').notNull(),
    feeAmount: baseUnits('fee_amount'),
    feeAssetId: text('fee_asset_id').references(() => assets.id),
    feeSponsored: boolean('fee_sponsored').notNull().default(false),
    counterpartyAddress: text('counterparty_address'),
    counterpartyId: uuid('counterparty_id').references(() => counterparties.id),
    status: txStatus('status').notNull(),
    blockNumber: bigint('block_number', { mode: 'bigint' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    source: txSource('source').notNull(),
    /** Dust / zero-value / look-alike transfers (T8): never shown in threads or "recent". */
    isSpam: boolean('is_spam').notNull().default(false),
    relatedType: text('related_type'),
    relatedId: uuid('related_id'),
    fiatValueMinor: fiatMinor('fiat_value_minor'),
    fiatCurrency: text('fiat_currency'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('transactions_event_uq').on(t.network, t.txHash, t.eventIndex, t.walletId),
    index('transactions_user_created_idx').on(t.userId, t.createdAt),
    index('transactions_counterparty_idx').on(t.counterpartyId, t.createdAt),
    check('transactions_amount_ck', sql`${t.amount} >= 0`),
  ],
);

/**
 * Phone sends to people not yet on Jokko, held in the escrow contract (P2, D5).
 * `amount` + `jokko_fee` are deposited; claim pays amount → recipient and fee → Jokko; cancel
 * or refund returns both to the sender.
 */
export const phoneSendInvites = pgTable(
  'phone_send_invites',
  {
    id: idColumn(),
    senderUserId: uuid('sender_user_id')
      .notNull()
      .references(() => users.id),
    recipientPhoneHash: text('recipient_phone_hash').notNull(),
    recipientPhoneEnc: encrypted('recipient_phone_enc').notNull(),
    recipientUserId: uuid('recipient_user_id').references(() => users.id),
    recipientWalletAddress: text('recipient_wallet_address').notNull(),
    network: networkKey('network').notNull(),
    escrowContract: text('escrow_contract').notNull(),
    escrowDepositId: text('escrow_deposit_id'),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    amount: baseUnits('amount').notNull(),
    jokkoFee: baseUnits('jokko_fee').notNull(),
    status: inviteStatus('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    claimTokenHash: text('claim_token_hash').notNull(),
    remindersSent: integer('reminders_sent').notNull().default(0),
    depositTxHash: text('deposit_tx_hash'),
    claimTxHash: text('claim_tx_hash'),
    refundTxHash: text('refund_tx_hash'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('phone_send_invites_claim_token_uq').on(t.claimTokenHash),
    index('phone_send_invites_status_expiry_idx').on(t.status, t.expiresAt),
    index('phone_send_invites_recipient_idx').on(t.recipientPhoneHash, t.status),
    check('phone_send_invites_amount_ck', sql`${t.amount} > 0 and ${t.jokkoFee} >= 0`),
  ],
);

/** Exactly what the user was shown (rate, fees, expiry): evidence for disputes and audits. */
export const quotes = pgTable(
  'quotes',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    kind: quoteKind('kind').notNull(),
    provider: text('provider'),
    requestJson: jsonb('request_json').notNull(),
    responseJson: jsonb('response_json').notNull(),
    rate: rate('rate'),
    feesJson: jsonb('fees_json').notNull(),
    feeScheduleId: uuid('fee_schedule_id'),
    jokkoFee: baseUnits('jokko_fee'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    ...createdAt(),
  },
  (t) => [index('quotes_user_idx').on(t.userId, t.createdAt)],
);

/** Top-ups and withdrawals through ramp providers (Fonbnk, IvoryPay, Bridge, card on-ramp). */
export const rampSessions = pgTable(
  'ramp_sessions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    provider: text('provider').notNull(),
    direction: rampDirection('direction').notNull(),
    providerOrderId: text('provider_order_id'),
    fiatAmountMinor: fiatMinor('fiat_amount_minor').notNull(),
    fiatCurrency: text('fiat_currency').notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    cryptoAmount: baseUnits('crypto_amount'),
    /** On-ramp: address supplied by the DEVICE (T3), never chosen by the server. */
    destinationAddress: text('destination_address'),
    /** Off-ramp: provider deposit address the user sends to. */
    providerDepositAddress: text('provider_deposit_address'),
    paymentMethod: text('payment_method').notNull(),
    country: char('country', { length: 2 }),
    status: rampStatus('status').notNull().default('created'),
    failureReason: text('failure_reason'),
    quoteId: uuid('quote_id').references(() => quotes.id),
    jokkoFeeMinor: fiatMinor('jokko_fee_minor'),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex('ramp_sessions_provider_order_uq').on(t.provider, t.providerOrderId),
    index('ramp_sessions_user_idx').on(t.userId, t.createdAt),
    index('ramp_sessions_status_idx').on(t.status),
  ],
);

/** Status history of ramp sessions (append-only). */
export const rampSessionEvents = pgTable(
  'ramp_session_events',
  {
    id: idColumn(),
    rampSessionId: uuid('ramp_session_id')
      .notNull()
      .references(() => rampSessions.id),
    fromStatus: rampStatus('from_status'),
    toStatus: rampStatus('to_status').notNull(),
    webhookEventId: uuid('webhook_event_id'),
    ...createdAt(),
  },
  (t) => [index('ramp_session_events_session_idx').on(t.rampSessionId, t.createdAt)],
);

/** Swaps and consolidations routed through LI.FI (D2). */
export const swapTransactions = pgTable(
  'swap_transactions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    provider: text('provider').notNull(),
    routeId: text('route_id'),
    fromNetwork: networkKey('from_network').notNull(),
    toNetwork: networkKey('to_network').notNull(),
    fromAssetId: text('from_asset_id')
      .notNull()
      .references(() => assets.id),
    toAssetId: text('to_asset_id')
      .notNull()
      .references(() => assets.id),
    fromAmount: baseUnits('from_amount').notNull(),
    toAmountExpected: baseUnits('to_amount_expected').notNull(),
    toAmountMin: baseUnits('to_amount_min').notNull(),
    toAmountReceived: baseUnits('to_amount_received'),
    slippageBps: integer('slippage_bps').notNull(),
    jokkoFeeBps: integer('jokko_fee_bps').notNull().default(0),
    jokkoFee: baseUnits('jokko_fee').notNull(),
    status: swapStatus('status').notNull().default('quoted'),
    sourceTxHash: text('source_tx_hash'),
    destTxHash: text('dest_tx_hash'),
    quoteId: uuid('quote_id').references(() => quotes.id),
    isConsolidation: boolean('is_consolidation').notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index('swap_transactions_user_idx').on(t.userId, t.createdAt),
    check('swap_min_le_expected_ck', sql`${t.toAmountMin} <= ${t.toAmountExpected}`),
  ],
);

/** Staking positions with Everstake (ETH, SOL at launch, D16). */
export const stakingPositions = pgTable(
  'staking_positions',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    network: networkKey('network').notNull(),
    provider: text('provider').notNull(),
    validatorOrPool: text('validator_or_pool').notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    staked: baseUnits('staked').notNull(),
    pendingUnstake: baseUnits('pending_unstake').notNull(),
    rewards: baseUnits('rewards').notNull(),
    status: stakingStatus('status').notNull(),
    unbondingEndsAt: timestamp('unbonding_ends_at', { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index('staking_positions_user_idx').on(t.userId)],
);

/** Stake / unstake / reward history (append-only). */
export const stakingEvents = pgTable('staking_events', {
  id: idColumn(),
  positionId: uuid('position_id')
    .notNull()
    .references(() => stakingPositions.id),
  kind: stakingEventKind('kind').notNull(),
  amount: baseUnits('amount').notNull(),
  txHash: text('tx_hash'),
  ...createdAt(),
});

/** Aave V3 positions — AFTER LAUNCH (borrow is not in launch scope, D1). */
export const loans = pgTable('loans', {
  id: idColumn(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  network: networkKey('network').notNull(),
  collateralAssetId: text('collateral_asset_id')
    .notNull()
    .references(() => assets.id),
  borrowedAssetId: text('borrowed_asset_id')
    .notNull()
    .references(() => assets.id),
  collateralAmount: baseUnits('collateral_amount').notNull(),
  borrowedAmount: baseUnits('borrowed_amount').notNull(),
  healthFactor: rate('health_factor'),
  status: loanStatus('status').notNull(),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  ...timestamps(),
});

/** Julaya cash top-up codes — AFTER LAUNCH, blocked on the liquidity decision (O5). */
export const cashTopupCodes = pgTable(
  'cash_topup_codes',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    /** Only a hash of the one-time code is stored. */
    codeHash: text('code_hash').notNull(),
    amountMinor: fiatMinor('amount_minor').notNull(),
    currency: text('currency').notNull(),
    status: cashCodeStatus('status').notNull().default('pending'),
    julayaReceiptRef: text('julaya_receipt_ref'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
    ...createdAt(),
  },
  (t) => [
    uniqueIndex('cash_topup_codes_code_uq').on(t.codeHash),
    uniqueIndex('cash_topup_codes_receipt_uq').on(t.julayaReceiptRef),
  ],
);
