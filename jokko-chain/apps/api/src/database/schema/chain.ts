/**
 * Networks, assets, capability overrides and wallets (docs/04-data-model.md §2).
 *
 * `networks` and `assets` mirror the registries in `@jokko/core` (the source of truth). They are
 * upserted by the seed step so other tables can reference them with foreign keys and analytics
 * can join on them. Never edit them by hand.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseUnits, createdAt, idColumn } from '../columns.js';
import { networkFamily, networkKey, walletKind } from './enums.js';
import { adminUsers } from './admin.js';
import { users } from './identity.js';

/** Mirror of `NETWORKS` from `@jokko/core`. */
export const networks = pgTable('networks', {
  key: networkKey('key').primaryKey(),
  family: networkFamily('family').notNull(),
  labelFr: text('label_fr').notNull(),
  labelEn: text('label_en').notNull(),
  nativeSymbol: text('native_symbol').notNull(),
  nativeDecimals: integer('native_decimals').notNull(),
  supportsEip7702: boolean('supports_eip7702').notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Mirror of `ASSETS` from `@jokko/core` (the curated allowlist, P7). */
export const assets = pgTable(
  'assets',
  {
    id: text('id').primaryKey(),
    symbol: text('symbol').notNull(),
    name: text('name').notNull(),
    network: networkKey('network')
      .notNull()
      .references(() => networks.key),
    kind: text('kind').notNull(),
    contractMainnet: text('contract_mainnet'),
    contractTestnet: text('contract_testnet'),
    decimals: integer('decimals').notNull(),
    isStablecoin: boolean('is_stablecoin').notNull(),
    priceId: text('price_id').notNull(),
    reviewStatus: text('review_status').notNull(),
    syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('assets_kind_ck', sql`${t.kind} in ('native', 'token')`),
    check('assets_decimals_ck', sql`${t.decimals} between 0 and 36`),
  ],
);

/**
 * Server-side capability overrides (kill switches). Can only narrow the static capability map
 * in `@jokko/core` (effectiveCapabilities); an "enable" beyond the code is ignored.
 */
export const capabilityOverrides = pgTable(
  'capability_overrides',
  {
    network: networkKey('network')
      .notNull()
      .references(() => networks.key),
    capability: text('capability').notNull(),
    enabled: boolean('enabled').notNull(),
    reason: text('reason').notNull(),
    updatedBy: uuid('updated_by').references(() => adminUsers.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.network, t.capability] })],
);

/**
 * User wallet addresses, one per family (EVM covers Ethereum, Polygon and BNB Chain).
 * One wallet per user per family at launch (P17). Addresses are stored in canonical form
 * (EIP-55 checksum case for EVM), so uniqueness is exact.
 */
export const wallets = pgTable(
  'wallets',
  {
    id: idColumn(),
    userId: uuid('user_id').references(() => users.id),
    family: networkFamily('family').notNull(),
    address: text('address').notNull(),
    privyWalletId: text('privy_wallet_id'),
    walletKind: walletKind('wallet_kind').notNull().default('embedded_eoa'),
    /** Pinned EIP-7702 delegate contract (D14); the app refuses any other. */
    delegationAddress: text('delegation_address'),
    /** Created by phone-send before the recipient signed up (then `user_id` may be set at claim). */
    isPregenerated: boolean('is_pregenerated').notNull().default(false),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    ...createdAt(),
  },
  (t) => [
    uniqueIndex('wallets_family_address_uq').on(t.family, t.address),
    uniqueIndex('wallets_user_family_uq').on(t.userId, t.family),
  ],
);

/** Balance cache for display and reporting. NEVER used to decide a send (chain is the truth). */
export const balanceSnapshots = pgTable(
  'balance_snapshots',
  {
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    balance: baseUnits('balance').notNull(),
    blockRef: text('block_ref'),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.walletId, t.assetId] })],
);

/**
 * Funds found at a user's EVM address on a network Jokko doesn't support (wrong-network safety
 * net, docs/01-architecture.md §7). Amount kept as the raw on-chain integer string.
 */
export const foreignNetworkDetections = pgTable(
  'foreign_network_detections',
  {
    id: idColumn(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id),
    chainName: text('chain_name').notNull(),
    assetSymbol: text('asset_symbol').notNull(),
    rawAmount: text('raw_amount').notNull(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [index('foreign_detections_wallet_idx').on(t.walletId)],
);
