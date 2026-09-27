/**
 * Idempotency for client requests that create something (ramp session, quote acceptance, send,
 * phone invite). The app sends an `Idempotency-Key` header (a UUID generated per user action);
 * a retry or a double-tap with the same key returns the FIRST result instead of creating a
 * duplicate. Reusing a key with a different request body is refused.
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../database/db.js';
import { idempotencyKeys } from '../database/schema/index.js';
import { ApiError } from './errors.js';
import { toJsonSafe } from './http/schemas.js';
import { CLOCK, DATABASE } from './tokens.js';
import type { Clock } from './clock.js';

const KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const TTL_MS = 24 * 60 * 60 * 1000;

/** Runs an operation at most once per (user, idempotency key). */
@Injectable()
export class IdempotencyService {
  /**
   * @param db - Database handle.
   * @param clock - Time source.
   */
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Executes `operation` once for this key; later calls with the same key and the same request
   * get the stored response. Concurrent duplicates are serialised by the unique index: the
   * loser sees `CONFLICT` and the client retries (and then receives the stored response).
   */
  async run<T>(
    userId: string,
    key: string | undefined,
    request: unknown,
    operation: () => Promise<T>,
  ): Promise<T> {
    if (!key) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required');
    if (!KEY_PATTERN.test(key)) {
      throw new ApiError('VALIDATION_FAILED', 'Idempotency-Key must be 16-128 URL-safe characters');
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify(toJsonSafe(request)))
      .digest('hex');

    const existing = await this.db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, key)))
      .limit(1);
    const found = existing[0];
    if (found) {
      if (found.requestHash !== requestHash) {
        throw new ApiError('IDEMPOTENCY_KEY_REUSED', 'this key was used for a different request');
      }
      if (found.responseJson === null) {
        throw new ApiError('CONFLICT', 'the original request is still in progress');
      }
      return found.responseJson as T;
    }

    const now = this.clock.now();
    const inserted = await this.db
      .insert(idempotencyKeys)
      .values({ userId, key, requestHash, expiresAt: new Date(now.getTime() + TTL_MS) })
      .onConflictDoNothing()
      .returning({ id: idempotencyKeys.id });
    const row = inserted[0];
    if (!row) throw new ApiError('CONFLICT', 'the original request is still in progress');

    try {
      const response = await operation();
      await this.db
        .update(idempotencyKeys)
        .set({ responseStatus: 200, responseJson: toJsonSafe(response) })
        .where(eq(idempotencyKeys.id, row.id));
      return toJsonSafe(response) as T;
    } catch (error) {
      // Failed attempts release the key so the user can retry the same action.
      await this.db.delete(idempotencyKeys).where(eq(idempotencyKeys.id, row.id));
      throw error;
    }
  }
}
