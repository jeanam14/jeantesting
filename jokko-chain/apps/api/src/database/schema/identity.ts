/**
 * Identity and access tables (docs/04-data-model.md §1).
 *
 * Personal data (names, phone, email, push tokens) is stored only encrypted (`*_enc`) plus a
 * keyed hash (`*_hash`) for exact-match lookups. The plaintext never reaches the database.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { createdAt, encrypted, idColumn, timestamps } from '../columns.js';
import { cloudBackup, consentType, devicePlatform, loginMethod, userStatus } from './enums.js';

/** One row per person. `privy_user_id` links to the Privy account that owns the wallets. */
export const users = pgTable(
  'users',
  {
    id: idColumn(),
    privyUserId: text('privy_user_id').notNull(),
    firstNameEnc: encrypted('first_name_enc'),
    lastNameEnc: encrypted('last_name_enc'),
    phoneEnc: encrypted('phone_enc'),
    /** HMAC-SHA256 of the E.164 phone number (hex), for lookup without decrypting. */
    phoneHash: text('phone_hash'),
    emailEnc: encrypted('email_enc'),
    emailHash: text('email_hash'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    country: char('country', { length: 2 }),
    locale: text('locale').notNull().default('fr'),
    displayCurrency: text('display_currency').notNull().default('XOF'),
    status: userStatus('status').notNull().default('active'),
    statusReason: text('status_reason'),
    referredByUserId: uuid('referred_by_user_id').references((): AnyPgColumn => users.id),
    signupSource: text('signup_source'),
    ...timestamps(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_privy_user_id_uq').on(t.privyUserId),
    uniqueIndex('users_phone_hash_uq').on(t.phoneHash),
    uniqueIndex('users_email_hash_uq').on(t.emailHash),
    check('users_locale_ck', sql`${t.locale} in ('fr', 'en')`),
    check('users_display_currency_ck', sql`${t.displayCurrency} in ('XOF', 'XAF', 'EUR', 'USD')`),
  ],
);

/** Each installed app instance. `device_id` is random, generated at install. */
export const userDevices = pgTable(
  'user_devices',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    deviceId: text('device_id').notNull(),
    platform: devicePlatform('platform').notNull(),
    osVersion: text('os_version'),
    appVersion: text('app_version'),
    /** Result of App Attest / Play Integrity verification. */
    attestationStatus: text('attestation_status').notNull().default('unverified'),
    pushTokenEnc: encrypted('push_token_enc'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    trustedAt: timestamp('trusted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('user_devices_user_device_uq').on(t.userId, t.deviceId)],
);

/** Security history (append-only): every login, used for new-device alerts. */
export const loginEvents = pgTable(
  'login_events',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    deviceId: text('device_id').notNull(),
    method: loginMethod('method').notNull(),
    ipCountry: char('ip_country', { length: 2 }),
    isNewDevice: boolean('is_new_device').notNull(),
    ...createdAt(),
  },
  (t) => [index('login_events_user_idx').on(t.userId, t.createdAt)],
);

/** What the user has set up for security (drives the security level, D13). */
export const securitySettings = pgTable('security_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  passkeyEnrolled: boolean('passkey_enrolled').notNull().default(false),
  totpEnrolled: boolean('totp_enrolled').notNull().default(false),
  cloudBackup: cloudBackup('cloud_backup').notNull().default('none'),
  appLockBiometric: boolean('app_lock_biometric').notNull().default(false),
  lastKeyExportAt: timestamp('last_key_export_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

/** Legal record of consents (append-only): the latest row per type is the current state. */
export const consents = pgTable(
  'consents',
  {
    id: idColumn(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: consentType('type').notNull(),
    /** Version of the document or wording accepted, e.g. `terms-2026-10-01`. */
    version: text('version').notNull(),
    granted: boolean('granted').notNull(),
    source: text('source').notNull(),
    ...createdAt(),
  },
  (t) => [index('consents_user_type_idx').on(t.userId, t.type, t.createdAt)],
);

/**
 * Notification toggles from Settings. Security alerts are not stored: they are always on (P11).
 * `marketing` mirrors the latest `marketing` consent and is only changed together with it.
 */
export const notificationPreferences = pgTable('notification_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  incomingTx: boolean('incoming_tx').notNull().default(true),
  outgoingTx: boolean('outgoing_tx').notNull().default(true),
  priceAlerts: boolean('price_alerts').notNull().default(true),
  marketing: boolean('marketing').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
