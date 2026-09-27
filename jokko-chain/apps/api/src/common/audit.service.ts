/**
 * Audit trail writer. Every sensitive action (security changes, key export, sends, admin
 * actions, config changes) goes through {@link AuditService.record}. The database hash-chains
 * each row (migration 0001), so the log is tamper-evident.
 *
 * Pass the current transaction when the action is part of one: the audit row then commits or
 * rolls back together with the change it describes.
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database, Transaction } from '../database/db.js';
import { auditLog } from '../database/schema/index.js';
import { DATABASE } from './tokens.js';
import { toJsonSafe } from './http/schemas.js';

/** One audit entry. `before`/`after` must not contain secrets; personal data only masked. */
export interface AuditEntry {
  readonly actorType: 'user' | 'admin' | 'system';
  readonly actorId: string;
  /** Dotted verb, e.g. `security.passkey_enrolled`, `fee_schedule.activated`. */
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string | null;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly ip?: string | null;
  readonly deviceId?: string | null;
  readonly reason?: string | null;
}

/** Writes and verifies the audit log. */
@Injectable()
export class AuditService {
  /** @param db - Database handle. */
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Appends an entry (inside `tx` when given). */
  async record(entry: AuditEntry, tx?: Transaction): Promise<void> {
    await (tx ?? this.db).insert(auditLog).values({
      actorType: entry.actorType,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      beforeJson: entry.before === undefined ? null : toJsonSafe(entry.before),
      afterJson: entry.after === undefined ? null : toJsonSafe(entry.after),
      ip: entry.ip ?? null,
      deviceId: entry.deviceId ?? null,
      reason: entry.reason ?? null,
    });
  }

  /** Re-computes the hash chain; returns the sequence numbers of broken rows (empty = intact). */
  async verify(): Promise<{ seq: string; problem: string }[]> {
    const result = await this.db.execute<{ bad_seq: string; problem: string }>(
      sql`SELECT bad_seq::text, problem FROM jokko_audit_verify()`,
    );
    return result.rows.map((row) => ({ seq: row.bad_seq, problem: row.problem }));
  }
}
