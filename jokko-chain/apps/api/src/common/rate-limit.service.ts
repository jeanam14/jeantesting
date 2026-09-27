/**
 * Business-level rate limits shared by every API instance (Postgres fixed-window counters).
 *
 * The HTTP rate limit (`@fastify/rate-limit`, per instance, per IP) is the first line of
 * defence against floods. This service protects specific, abuse-sensitive actions per USER
 * across all instances: phone-number lookups (enumeration of who uses Jokko), invite creation
 * and waitlist sign-ups. Limits are small and explicit at each call site.
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/db.js';
import { ApiError } from './errors.js';
import { CLOCK, DATABASE } from './tokens.js';
import type { Clock } from './clock.js';

/** One limit: at most `limit` actions per `windowSeconds`. */
export interface RateLimitRule {
  readonly limit: number;
  readonly windowSeconds: number;
}

/** Consumes rate-limit tokens. */
@Injectable()
export class RateLimitService {
  /**
   * @param db - Database handle.
   * @param clock - Time source.
   */
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Counts one action for `key` in every rule's current window and throws `RATE_LIMITED` when
   * any rule is exceeded. The increment is atomic (`INSERT … ON CONFLICT DO UPDATE`), so two
   * concurrent requests can never both slip under the limit.
   *
   * @param key - `<action>:<subject>`; must not contain raw personal data (use ids or hashes).
   * @param rules - E.g. `[{ limit: 20, windowSeconds: 3600 }, { limit: 100, windowSeconds: 86400 }]`.
   */
  async consume(key: string, rules: readonly RateLimitRule[]): Promise<void> {
    const nowMs = this.clock.now().getTime();
    for (const rule of rules) {
      const windowMs = rule.windowSeconds * 1000;
      const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);
      const expiresAt = new Date(windowStart.getTime() + windowMs);
      const bucketKey = `${key}:${rule.windowSeconds}`;
      const result = await this.db.execute<{ count: number }>(sql`
        INSERT INTO rate_limit_buckets (key, window_start, count, expires_at)
        VALUES (${bucketKey}, ${windowStart}, 1, ${expiresAt})
        ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limit_buckets.count + 1
        RETURNING count
      `);
      const count = Number(result.rows[0]?.count ?? 0);
      if (count > rule.limit) {
        throw new ApiError('RATE_LIMITED', 'too many attempts, please try again later', {
          retryAfterSeconds: Math.ceil((expiresAt.getTime() - nowMs) / 1000),
        });
      }
    }
  }

  /** Deletes expired windows (called by the `maintenance.cleanup` job). Returns rows deleted. */
  async purgeExpired(): Promise<number> {
    const result = await this.db.execute(
      sql`DELETE FROM rate_limit_buckets WHERE expires_at < ${this.clock.now()}`,
    );
    return result.rowCount ?? 0;
  }
}
