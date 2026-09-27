/**
 * The database's own guarantees (migration 0001 and table constraints), tested against real
 * PostgreSQL. If any of these fail, the security model in docs/02-security.md does not hold.
 */
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { uuidv7 } from '../../src/common/ids.js';
import type { DatabaseHandle } from '../../src/database/db.js';
import {
  adminApprovals,
  adminUsers,
  assets,
  auditLog,
  consents,
  feeSchedules,
  networks,
  referralPrograms,
  referrals,
  users,
  webhookEvents,
} from '../../src/database/schema/index.js';
import { seed } from '../../src/database/seed.js';
import { openTestDatabase } from '../support/database.js';

let handle: DatabaseHandle;

async function expectDbError(promise: Promise<unknown>, pattern: RegExp): Promise<void> {
  let failed = false;
  try {
    await promise;
  } catch (error) {
    failed = true;
    // Drizzle wraps driver errors; the database message is on `cause`.
    const cause = (error as { cause?: { message?: string } }).cause;
    const message = `${(error as Error).message} ${cause?.message ?? ''}`;
    expect(message).toMatch(pattern);
  }
  expect(failed, 'expected the database to reject the statement').toBe(true);
}

async function createUser(): Promise<string> {
  const id = uuidv7();
  await handle.db.insert(users).values({ id, privyUserId: `did:privy:${id}` });
  return id;
}

async function createAdmin(name: string): Promise<string> {
  const id = uuidv7();
  await handle.db.insert(adminUsers).values({
    id,
    ssoSubject: `sso|${id}`,
    email: `${name}@jokkochain.com`,
    displayName: name,
  });
  return id;
}

beforeAll(async () => {
  handle = openTestDatabase();
  await seed(handle.db);
});

afterAll(async () => {
  await handle.close();
});

describe('seed', () => {
  it('mirrors every network and asset from @jokko/core and is idempotent', async () => {
    await seed(handle.db);
    const networkCount = await handle.db.select({ n: sql<number>`count(*)::int` }).from(networks);
    const assetRows = await handle.db.select().from(assets).where(eq(assets.id, 'usdt:bsc'));
    expect(networkCount[0]?.n).toBe(6);
    expect(assetRows[0]?.decimals).toBe(18);
    const programs = await handle.db.select().from(referralPrograms);
    expect(programs).toHaveLength(1);
    expect(programs[0]?.rewardAmount).toBe(5_000_000n);
  });
});

describe('append-only tables', () => {
  it('rejects UPDATE and DELETE on consents', async () => {
    const userId = await createUser();
    await handle.db.insert(consents).values({
      userId,
      type: 'terms',
      version: 'test-1',
      granted: true,
      source: 'onboarding',
    });
    await expectDbError(
      handle.db.update(consents).set({ granted: false }).where(eq(consents.userId, userId)),
      /append-only/,
    );
    await expectDbError(
      handle.db.delete(consents).where(eq(consents.userId, userId)),
      /append-only/,
    );
  });

  it('rejects TRUNCATE on the audit log', async () => {
    await expectDbError(handle.db.execute(sql`TRUNCATE audit_log`), /append-only/);
  });
});

describe('hash-chained audit log', () => {
  it('chains every row to the previous one and verifies clean', async () => {
    for (let i = 0; i < 5; i++) {
      await handle.db.insert(auditLog).values({
        actorType: 'system',
        actorId: 'test',
        action: `test.action.${i}`,
        targetType: 'test',
        targetId: String(i),
        afterJson: { i, amount: '1000' },
      });
    }
    const rows = await handle.db.select().from(auditLog).orderBy(auditLog.seq);
    expect(rows.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]?.prevHash?.equals(rows[i - 1]?.hash as Buffer)).toBe(true);
    }
    expect(rows[0]?.prevHash).toBeNull();
    const problems = await handle.db.execute(sql`SELECT * FROM jokko_audit_verify()`);
    expect(problems.rows).toEqual([]);
  });

  it('detects tampering even when an attacker bypasses the triggers', async () => {
    await handle.db
      .transaction(async (tx) => {
        // Simulate a superuser editing a row with triggers disabled for this session.
        await tx.execute(sql`SET LOCAL session_replication_role = replica`);
        await tx.execute(
          sql`UPDATE audit_log SET after_json = '{"i": 2, "amount": "999999"}'::jsonb WHERE action = 'test.action.2'`,
        );
        const problems = await tx.execute(sql`SELECT * FROM jokko_audit_verify()`);
        expect(problems.rows).toHaveLength(1);
        expect(problems.rows[0]).toMatchObject({ problem: 'content does not match hash' });
        tx.rollback();
      })
      .catch((error: unknown) => {
        // Drizzle signals the intentional rollback with an error; anything else is a failure.
        if (!(error instanceof Error) || !/rollback/i.test(error.message)) throw error;
      });
  });
});

describe('webhook idempotency and immutability', () => {
  const row = () => ({
    provider: 'mockramp',
    providerEventId: 'evt_123',
    eventType: 'order.completed',
    signatureValid: true,
    payloadEnc: Buffer.from('encrypted'),
    payloadSha256: Buffer.alloc(32, 1),
  });

  it('refuses the same provider event twice', async () => {
    await handle.db.insert(webhookEvents).values(row());
    await expectDbError(handle.db.insert(webhookEvents).values(row()), /duplicate key/);
  });

  it('allows status updates but never payload changes or deletes', async () => {
    await handle.db
      .update(webhookEvents)
      .set({ status: 'processed', processedAt: new Date() })
      .where(eq(webhookEvents.providerEventId, 'evt_123'));
    await expectDbError(
      handle.db
        .update(webhookEvents)
        .set({ payloadEnc: Buffer.from('forged') })
        .where(eq(webhookEvents.providerEventId, 'evt_123')),
      /immutable/,
    );
    await expectDbError(
      handle.db.delete(webhookEvents).where(eq(webhookEvents.providerEventId, 'evt_123')),
      /cannot be deleted/,
    );
  });
});

describe('four-eyes rules enforced by the database', () => {
  it('refuses an approval decided by its requester', async () => {
    const alice = await createAdmin('alice');
    const [approval] = await handle.db
      .insert(adminApprovals)
      .values({
        action: 'fee_schedule.activate',
        targetType: 'fee_schedule',
        payloadJson: {},
        requestedBy: alice,
        reason: 'launch fees',
        expiresAt: new Date(Date.now() + 86_400_000),
      })
      .returning();
    await expectDbError(
      handle.db
        .update(adminApprovals)
        .set({ decidedBy: alice, status: 'approved' })
        .where(eq(adminApprovals.id, approval!.id)),
      /admin_approvals_four_eyes_ck/,
    );
    const bob = await createAdmin('bob');
    await handle.db
      .update(adminApprovals)
      .set({ decidedBy: bob, status: 'approved' })
      .where(eq(adminApprovals.id, approval!.id));
  });

  it('refuses a fee schedule approved by its creator and invalid fee values', async () => {
    const carol = await createAdmin('carol');
    const base = {
      product: 'send' as const,
      pctBps: 50,
      fixedMinor: 100n,
      fixedCurrency: 'XOF',
      effectiveFrom: new Date(),
      createdBy: carol,
    };
    await expectDbError(
      handle.db.insert(feeSchedules).values({ ...base, approvedBy: carol }),
      /fee_schedules_four_eyes_ck/,
    );
    await expectDbError(
      handle.db.insert(feeSchedules).values({ ...base, pctBps: 10_001 }),
      /fee_schedules_pct_ck/,
    );
    await expectDbError(
      handle.db.insert(feeSchedules).values({ ...base, minMinor: 10n, maxMinor: 5n }),
      /fee_schedules_min_max_ck/,
    );
  });
});

describe('referral constraints', () => {
  it('refuses self-referral and a second referral of the same person', async () => {
    const a = await createUser();
    const b = await createUser();
    const c = await createUser();
    await expectDbError(
      handle.db
        .insert(referrals)
        .values({ referrerUserId: a, refereeUserId: a, programVersion: 1, attribution: 'code' }),
      /referrals_not_self_ck/,
    );
    await handle.db
      .insert(referrals)
      .values({ referrerUserId: a, refereeUserId: b, programVersion: 1, attribution: 'code' });
    await expectDbError(
      handle.db
        .insert(referrals)
        .values({ referrerUserId: c, refereeUserId: b, programVersion: 1, attribution: 'link' }),
      /duplicate key/,
    );
  });
});

describe('analytics views', () => {
  it('expose no personal data columns', async () => {
    const result = await handle.db.execute(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'analytics'
        AND (column_name LIKE '%\_enc' OR column_name LIKE '%\_hash' OR column_name LIKE '%address%'
             OR column_name IN ('email', 'phone', 'first_name', 'last_name'))
    `);
    expect(result.rows).toEqual([]);
  });
});

describe('money columns', () => {
  it('store amounts beyond 2^64 exactly (uint256 range)', async () => {
    const userId = await createUser();
    const big = 2n ** 255n + 12345n;
    const [program] = await handle.db
      .insert(referralPrograms)
      .values({
        rewardAmount: big,
        rewardAssetId: 'usdc:polygon',
        minTopupMinor: 1n,
        minTopupCurrency: 'XOF',
        qualifyWithinDays: 1,
        holdDays: 0,
        maxRewardsPerReferrerPerMonth: 1,
        dailyBudget: big,
        activeFrom: new Date(),
      })
      .returning();
    expect(program?.rewardAmount).toBe(big);
    expect(userId).toBeTruthy();
  });
});
