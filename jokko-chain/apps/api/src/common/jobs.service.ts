/**
 * Postgres-backed job queue and transactional outbox (ADR 0002).
 *
 * `enqueue` inside the business transaction ⇒ the job exists if and only if the change
 * committed. Workers claim jobs with `FOR UPDATE SKIP LOCKED` (many workers, no double
 * processing) and retry with exponential backoff; after `max_attempts` a job is `dead` and
 * raises an alert instead of silently disappearing.
 */
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database, Transaction } from '../database/db.js';
import { jobs } from '../database/schema/index.js';
import { CLOCK, DATABASE } from './tokens.js';
import type { Clock } from './clock.js';
import { toJsonSafe } from './http/schemas.js';

/** Every queue the workers know. Adding a queue = adding a handler in the worker. */
export type JobQueue =
  | 'notifications.send'
  | 'phone_send.refund_due'
  | 'phone_send.reminder'
  | 'phone_send.auto_claim'
  | 'referrals.evaluate'
  | 'referrals.payout'
  | 'webhooks.process'
  | 'audit.verify';

/** Options for {@link JobsService.enqueue}. */
export interface EnqueueOptions {
  /** Earliest execution time (default: now). */
  readonly runAt?: Date;
  /** Same key ⇒ enqueued at most once (idempotent enqueue). */
  readonly dedupeKey?: string;
  readonly maxAttempts?: number;
}

/** A claimed job, as seen by a worker handler. */
export interface ClaimedJob {
  readonly id: string;
  readonly queue: JobQueue;
  readonly payload: Record<string, unknown>;
  readonly attempts: number;
  readonly maxAttempts: number;
}

/** Enqueue, claim and complete jobs. */
@Injectable()
export class JobsService {
  /**
   * @param db - Database handle.
   * @param clock - Time source.
   */
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Enqueues a job. Returns `false` when a job with the same `dedupeKey` already exists. */
  async enqueue(
    queue: JobQueue,
    payload: Record<string, unknown>,
    options: EnqueueOptions = {},
    tx?: Transaction,
  ): Promise<boolean> {
    const inserted = await (tx ?? this.db)
      .insert(jobs)
      .values({
        queue,
        payload: toJsonSafe(payload),
        runAt: options.runAt ?? this.clock.now(),
        dedupeKey: options.dedupeKey ?? null,
        maxAttempts: options.maxAttempts ?? 8,
      })
      .onConflictDoNothing({ target: jobs.dedupeKey })
      .returning({ id: jobs.id });
    return inserted.length > 0;
  }

  /**
   * Claims up to `limit` ready jobs from the given queues for `workerId`. Jobs stuck in
   * `running` for more than `staleAfterMs` (crashed worker) are re-claimed.
   */
  async claim(
    queues: readonly JobQueue[],
    workerId: string,
    limit = 10,
    staleAfterMs = 5 * 60_000,
  ): Promise<ClaimedJob[]> {
    const now = this.clock.now();
    const staleBefore = new Date(now.getTime() - staleAfterMs);
    const result = await this.db.execute<{
      id: string;
      queue: JobQueue;
      payload: Record<string, unknown>;
      attempts: number;
      max_attempts: number;
    }>(sql`
      UPDATE jobs SET status = 'running', locked_at = ${now}, locked_by = ${workerId},
                      attempts = attempts + 1, updated_at = ${now}
      WHERE id IN (
        SELECT id FROM jobs
        WHERE queue IN (${sql.join(
          queues.map((q) => sql`${q}`),
          sql`, `,
        )})
          AND run_at <= ${now}
          AND (status = 'pending' OR (status = 'running' AND locked_at < ${staleBefore}))
        ORDER BY run_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, queue, payload, attempts, max_attempts
    `);
    return result.rows.map((row) => ({
      id: row.id,
      queue: row.queue,
      payload: row.payload,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
    }));
  }

  /** Marks a job done. */
  async complete(jobId: string): Promise<void> {
    await this.db.execute(
      sql`UPDATE jobs SET status = 'succeeded', locked_at = NULL, updated_at = ${this.clock.now()} WHERE id = ${jobId}`,
    );
  }

  /**
   * Records a failure: retried later with exponential backoff (30 s, 1 min, 2 min, … capped at
   * 1 h), or marked `dead` once attempts are exhausted.
   */
  async fail(job: ClaimedJob, error: unknown): Promise<'retry' | 'dead'> {
    const message = error instanceof Error ? error.message : String(error);
    const dead = job.attempts >= job.maxAttempts;
    const delayMs = Math.min(30_000 * 2 ** (job.attempts - 1), 3_600_000);
    const now = this.clock.now();
    await this.db.execute(sql`
      UPDATE jobs SET status = ${dead ? 'dead' : 'pending'}, locked_at = NULL,
             last_error = ${message.slice(0, 2000)},
             run_at = ${new Date(now.getTime() + delayMs)}, updated_at = ${now}
      WHERE id = ${job.id}
    `);
    return dead ? 'dead' : 'retry';
  }
}
