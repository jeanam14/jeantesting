/**
 * Idempotent seed: mirrors the `@jokko/core` registries into the database and creates default
 * configuration rows. Safe to run on every deploy (after migrations).
 *
 * - `networks` / `assets` are UPSERTED from core (core is the source of truth).
 * - Flags, app config and the first referral programme are INSERTED ONLY IF MISSING, so values
 *   changed by staff in the admin dashboard are never overwritten.
 * - No fee schedule is created: fee levels are a business decision (O13) set in the dashboard.
 */
import { fileURLToPath } from 'node:url';
import {
  ASSETS,
  DEFAULT_SECURITY_THRESHOLDS,
  NETWORK_KEYS,
  NETWORKS,
  UEMOA_COUNTRIES,
  CEMAC_COUNTRIES,
} from '@jokko/core';
import { sql } from 'drizzle-orm';
import { createDatabase, type Database } from './db.js';
import { appConfig, assets, featureFlags, networks, referralPrograms } from './schema/index.js';

/** Default feature flags. `forbiddenInProduction` ones make the API refuse to start in prod. */
export const DEFAULT_FLAGS = [
  {
    key: 'demo_mode',
    description: 'Show sample data for features not yet connected (D23)',
    owner: 'engineering',
    enabled: false,
    forbiddenInProduction: true,
  },
  {
    key: 'staking',
    description: 'Staking (ETH, SOL) visible in the app (D1: behind a flag)',
    owner: 'product',
    enabled: false,
    forbiddenInProduction: false,
  },
  {
    key: 'swap',
    description: 'Swap via LI.FI',
    owner: 'product',
    enabled: false,
    forbiddenInProduction: false,
  },
  {
    key: 'ramps',
    description: 'Top-up and withdrawal via ramp providers',
    owner: 'product',
    enabled: false,
    forbiddenInProduction: false,
  },
  {
    key: 'phone_send_invites',
    description: 'Phone sends to non-users via escrow (P3: after audit)',
    owner: 'product',
    enabled: false,
    forbiddenInProduction: false,
  },
  {
    key: 'referrals',
    description: 'Referral programme (D22)',
    owner: 'growth',
    enabled: false,
    forbiddenInProduction: false,
  },
  {
    key: 'card_waitlist',
    description: 'Card waitlist screen',
    owner: 'growth',
    enabled: true,
    forbiddenInProduction: false,
  },
  {
    key: 'business_waitlist',
    description: 'Business waitlist screen',
    owner: 'growth',
    enabled: true,
    forbiddenInProduction: false,
  },
] as const;

/** Default key/value configuration (all editable in the admin dashboard). */
export const DEFAULT_APP_CONFIG: Record<string, unknown> = {
  min_app_version: { ios: '1.0.0', android: '1.0.0' },
  security_thresholds_xof: {
    promptLevel2At: DEFAULT_SECURITY_THRESHOLDS.promptLevel2AtXof.toString(),
    requirePasskeyToSendAt: DEFAULT_SECURITY_THRESHOLDS.requirePasskeyToSendAtXof.toString(),
    recommendBackupAt: DEFAULT_SECURITY_THRESHOLDS.recommendBackupAtXof.toString(),
    largeSendConfirmAt: DEFAULT_SECURITY_THRESHOLDS.largeSendConfirmAtXof.toString(),
  },
  signup_countries: [...UEMOA_COUNTRIES, ...CEMAC_COUNTRIES],
  phone_send_invite_limits_xof: { perInviteMax: '100000', perSenderDailyMax: '300000' },
  phone_send_invite_ttl_hours: 48,
  legal_versions: { terms: 'draft-2026-09', privacy: 'draft-2026-09', risk: 'draft-2026-09' },
};

/** Runs the seed against an open database. */
export async function seed(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    for (const key of NETWORK_KEYS) {
      const n = NETWORKS[key];
      const row = {
        key: n.key,
        family: n.family,
        labelFr: n.label.fr,
        labelEn: n.label.en,
        nativeSymbol: n.nativeAsset.symbol,
        nativeDecimals: n.nativeAsset.decimals,
        supportsEip7702: n.supportsEip7702,
        syncedAt: new Date(),
      };
      await tx.insert(networks).values(row).onConflictDoUpdate({ target: networks.key, set: row });
    }
    for (const a of ASSETS) {
      const row = {
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        network: a.network,
        kind: a.kind,
        contractMainnet: a.contract.mainnet,
        contractTestnet: a.contract.testnet,
        decimals: a.decimals,
        isStablecoin: a.isStablecoin,
        priceId: a.priceId,
        reviewStatus: a.review.status,
        syncedAt: new Date(),
      };
      await tx.insert(assets).values(row).onConflictDoUpdate({ target: assets.id, set: row });
    }
    for (const flag of DEFAULT_FLAGS) {
      await tx
        .insert(featureFlags)
        .values({ ...flag })
        .onConflictDoNothing();
    }
    for (const [key, value] of Object.entries(DEFAULT_APP_CONFIG)) {
      await tx.insert(appConfig).values({ key, valueJson: value }).onConflictDoNothing();
    }
    // First referral programme (D22 + P16 defaults): $5 in USDC on Polygon.
    const existing = await tx.select({ n: sql<number>`count(*)::int` }).from(referralPrograms);
    if ((existing[0]?.n ?? 0) === 0) {
      await tx.insert(referralPrograms).values({
        rewardAmount: 5_000_000n,
        rewardAssetId: 'usdc:polygon',
        refereeRewardAmount: null,
        minTopupMinor: 10_000n,
        minTopupCurrency: 'XOF',
        qualifyWithinDays: 30,
        holdDays: 7,
        maxRewardsPerReferrerPerMonth: 20,
        dailyBudget: 500_000_000n,
        activeFrom: new Date('2026-01-01T00:00:00Z'),
      });
    }
  });
}

// CLI entry point: `node dist/database/seed.js`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  const handle = createDatabase({
    connectionString: url,
    maxConnections: 1,
    applicationName: 'seed',
  });
  seed(handle.db)
    .then(() => console.log('seed applied'))
    .catch((error: unknown) => {
      console.error('seed failed', error);
      process.exitCode = 1;
    })
    .finally(() => void handle.close());
}
