/**
 * Staff accounts, four-eyes approvals and the tamper-evident audit trail
 * (docs/04-data-model.md §8, docs/01-architecture.md §10).
 */
import { sql } from 'drizzle-orm';
import {
  bigserial,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea, createdAt, idColumn } from '../columns.js';
import { actorType, adminRole, approvalStatus } from './enums.js';

/** Staff accounts. Login is via SSO (the `sso_subject` from the identity provider). */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: idColumn(),
    ssoSubject: text('sso_subject').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull().default('active'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...createdAt(),
  },
  (t) => [
    uniqueIndex('admin_users_sso_subject_uq').on(t.ssoSubject),
    check('admin_users_status_ck', sql`${t.status} in ('active', 'suspended')`),
  ],
);

/** Role assignments (a staff member can hold several roles). */
export const adminUserRoles = pgTable(
  'admin_user_roles',
  {
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id),
    role: adminRole('role').notNull(),
    ...createdAt(),
  },
  (t) => [primaryKey({ columns: [t.adminUserId, t.role] })],
);

/**
 * Four-eyes approval requests. The database itself refuses an approval by the requester
 * (`admin_approvals_four_eyes_ck`), so the rule can't be bypassed by a bug in the API.
 */
export const adminApprovals = pgTable(
  'admin_approvals',
  {
    id: idColumn(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    payloadJson: jsonb('payload_json').notNull(),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => adminUsers.id),
    decidedBy: uuid('decided_by').references(() => adminUsers.id),
    status: approvalStatus('status').notNull().default('pending'),
    reason: text('reason').notNull(),
    decisionNote: text('decision_note'),
    ...createdAt(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('admin_approvals_status_idx').on(t.status, t.createdAt),
    check(
      'admin_approvals_four_eyes_ck',
      sql`${t.decidedBy} is null or ${t.decidedBy} <> ${t.requestedBy}`,
    ),
  ],
);

/**
 * Every sensitive action by users, staff and the system. Append-only and hash-chained: a
 * database trigger (migration `0001_security_hardening`) sets `prev_hash` and `hash` on insert
 * and rejects any UPDATE or DELETE, so tampering is detectable by re-computing the chain.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    seq: bigserial('seq', { mode: 'bigint' }).primaryKey(),
    actorType: actorType('actor_type').notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    beforeJson: jsonb('before_json'),
    afterJson: jsonb('after_json'),
    ip: text('ip'),
    deviceId: text('device_id'),
    reason: text('reason'),
    prevHash: bytea('prev_hash'),
    hash: bytea('hash'),
    ...createdAt(),
  },
  (t) => [index('audit_log_target_idx').on(t.targetType, t.targetId)],
);

/** Who revealed which personal field, and why (append-only). */
export const piiAccessLog = pgTable('pii_access_log', {
  id: idColumn(),
  adminUserId: uuid('admin_user_id')
    .notNull()
    .references(() => adminUsers.id),
  userId: uuid('user_id').notNull(),
  field: text('field').notNull(),
  reason: text('reason').notNull(),
  ...createdAt(),
});

/** Who exported which list (append-only). */
export const dataExports = pgTable('data_exports', {
  id: idColumn(),
  adminUserId: uuid('admin_user_id')
    .notNull()
    .references(() => adminUsers.id),
  queryDescription: text('query_description').notNull(),
  filtersJson: jsonb('filters_json').notNull(),
  rowCount: integer('row_count').notNull(),
  purpose: text('purpose').notNull(),
  ...createdAt(),
});
