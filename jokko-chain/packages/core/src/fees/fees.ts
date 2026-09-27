/**
 * Jokko fee engine (D17, docs/09-fees-and-referrals.md).
 *
 * Pure functions: given the active fee schedules and a transaction context, pick the schedule
 * that applies and compute the exact fee in the asset's base units. The same code runs on the
 * server (to build the quote) and in the app (to verify the fee inside the transaction the user
 * is about to sign, T19): if a compromised server inflated the fee, the app's own computation
 * would not match and the app refuses to sign.
 *
 * Rounding always favours the user: every step rounds **down**.
 */
import { JokkoCoreError } from '../errors.js';
import { fiatToAsset } from '../money/convert.js';
import { mulDiv, type ExactDecimal } from '../money/decimal.js';
import type { FiatCurrency } from '../money/fiat.js';
import type { NetworkKey } from '../networks/networks.js';

/** Products a Jokko fee can apply to. Stored in the database; never rename. */
export type FeeProduct =
  | 'topup'
  | 'withdraw'
  | 'send'
  | 'phone_send'
  | 'swap'
  | 'consolidate'
  | 'stake'
  | 'borrow'
  | 'card'
  | 'cash_topup';

/** One active fee rule, as configured in the admin console. */
export interface FeeSchedule {
  readonly id: string;
  readonly product: FeeProduct;
  /** Optional sub-action, e.g. `external_address` vs `jokko_user` for `send`. */
  readonly action: string | null;
  readonly network: NetworkKey | null;
  /** Asset symbol (e.g. `USDC`), or null for any asset. */
  readonly assetSymbol: string | null;
  /** ISO 3166-1 alpha-2 country, or null for any country. */
  readonly country: string | null;
  /** Named user segment (e.g. `new_users`), or null for everyone. */
  readonly segment: string | null;
  /** Percentage part in basis points (50 = 0.50 %). */
  readonly pctBps: number;
  /** Fixed part, in minor units of `fixedCurrency`. */
  readonly fixedMinor: bigint;
  readonly fixedCurrency: FiatCurrency;
  /** Minimum total fee (same currency), or null. */
  readonly minMinor: bigint | null;
  /** Maximum total fee (same currency), or null. */
  readonly maxMinor: bigint | null;
  /** Tie-breaker between equally specific schedules: higher wins. */
  readonly priority: number;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
}

/** Facts about the operation being priced. */
export interface FeeContext {
  readonly product: FeeProduct;
  readonly action?: string | null;
  readonly network?: NetworkKey | null;
  readonly assetSymbol?: string | null;
  readonly country?: string | null;
  /** Segments the user belongs to. */
  readonly segments?: readonly string[];
  /** When the operation happens (usually now). */
  readonly at: Date;
}

/** Checks a schedule's internal consistency (used when an admin saves one). */
export function assertValidFeeSchedule(schedule: FeeSchedule): void {
  const fail = (message: string): never => {
    throw new JokkoCoreError('INVALID_FEE_SCHEDULE', message);
  };
  if (!Number.isInteger(schedule.pctBps) || schedule.pctBps < 0 || schedule.pctBps > 10_000) {
    fail('pctBps must be an integer between 0 and 10000');
  }
  if (schedule.fixedMinor < 0n) fail('fixed amount must not be negative');
  if (schedule.minMinor !== null && schedule.minMinor < 0n) fail('minimum must not be negative');
  if (schedule.maxMinor !== null && schedule.maxMinor < 0n) fail('maximum must not be negative');
  if (
    schedule.minMinor !== null &&
    schedule.maxMinor !== null &&
    schedule.minMinor > schedule.maxMinor
  ) {
    fail('minimum must not exceed maximum');
  }
  if (schedule.effectiveTo !== null && schedule.effectiveTo <= schedule.effectiveFrom) {
    fail('effectiveTo must be after effectiveFrom');
  }
}

/**
 * Returns the schedule that applies to `context`, or `null` when no Jokko fee applies.
 *
 * A schedule matches when it is active at `context.at` and each of its non-null criteria equals
 * the context. Among matches, the **most specific** wins (most non-null criteria), then the
 * highest `priority`, then the most recent `effectiveFrom`, then the smallest `id` (so the
 * result is always deterministic).
 */
export function selectFeeSchedule(
  schedules: readonly FeeSchedule[],
  context: FeeContext,
): FeeSchedule | null {
  const segments = new Set(context.segments ?? []);
  const matches = schedules.filter((s) => {
    if (s.product !== context.product) return false;
    if (s.effectiveFrom > context.at) return false;
    if (s.effectiveTo !== null && s.effectiveTo <= context.at) return false;
    if (s.action !== null && s.action !== (context.action ?? null)) return false;
    if (s.network !== null && s.network !== (context.network ?? null)) return false;
    if (s.assetSymbol !== null && s.assetSymbol !== (context.assetSymbol ?? null)) return false;
    if (s.country !== null && s.country !== (context.country ?? null)) return false;
    if (s.segment !== null && !segments.has(s.segment)) return false;
    return true;
  });
  const specificity = (s: FeeSchedule): number =>
    [s.action, s.network, s.assetSymbol, s.country, s.segment].filter((v) => v !== null).length;
  matches.sort(
    (a, b) =>
      specificity(b) - specificity(a) ||
      b.priority - a.priority ||
      b.effectiveFrom.getTime() - a.effectiveFrom.getTime() ||
      a.id.localeCompare(b.id),
  );
  return matches[0] ?? null;
}

/** Input to {@link computeFee}. */
export interface ComputeFeeInput {
  readonly schedule: FeeSchedule;
  /** Amount the fee is based on, in the asset's base units. */
  readonly amountBaseUnits: bigint;
  readonly assetDecimals: number;
  /** Price of one whole asset unit in the schedule's `fixedCurrency` (needed for fixed/min/max). */
  readonly pricePerAsset: ExactDecimal;
}

/** Fee breakdown returned by {@link computeFee}. Every value is in the asset's base units. */
export interface FeeBreakdown {
  readonly scheduleId: string;
  readonly percentagePart: bigint;
  readonly fixedPart: bigint;
  /** Final fee after min/max clamping. */
  readonly total: bigint;
  /** Whether the minimum or maximum changed the result. */
  readonly clampedTo: 'min' | 'max' | null;
}

/**
 * Computes the Jokko fee for an amount. Everything rounds down.
 *
 * total = floor(amount × pctBps ÷ 10 000) + fixed (converted from fiat), then clamped to
 * [min, max] (each converted from fiat).
 */
export function computeFee(input: ComputeFeeInput): FeeBreakdown {
  const { schedule, amountBaseUnits, assetDecimals, pricePerAsset } = input;
  assertValidFeeSchedule(schedule);
  if (amountBaseUnits < 0n) {
    throw new JokkoCoreError('NEGATIVE_AMOUNT', 'amount must not be negative');
  }
  const toAsset = (minor: bigint): bigint =>
    fiatToAsset(minor, schedule.fixedCurrency, pricePerAsset, assetDecimals, 'down');

  const percentagePart = mulDiv(amountBaseUnits, BigInt(schedule.pctBps), 10_000n, 'down');
  const fixedPart = toAsset(schedule.fixedMinor);
  let total = percentagePart + fixedPart;
  let clampedTo: FeeBreakdown['clampedTo'] = null;

  if (schedule.minMinor !== null) {
    const min = toAsset(schedule.minMinor);
    if (total < min) {
      total = min;
      clampedTo = 'min';
    }
  }
  if (schedule.maxMinor !== null) {
    const max = toAsset(schedule.maxMinor);
    if (total > max) {
      total = max;
      clampedTo = 'max';
    }
  }
  return { scheduleId: schedule.id, percentagePart, fixedPart, total, clampedTo };
}

/** A fee transfer found inside a transaction the user is about to sign. */
export interface FeeTransfer {
  readonly recipient: string;
  readonly amountBaseUnits: bigint;
}

/**
 * Anti-tampering check run by the app before signing (T19): the transaction must contain
 * exactly the quoted fee, sent to one of the Jokko fee addresses compiled into the app.
 * With no quoted fee, the transaction must contain no fee transfer at all.
 */
export function verifyFeeTransfer(
  quotedFee: bigint,
  transfer: FeeTransfer | null,
  trustedFeeAddresses: readonly string[],
): boolean {
  if (quotedFee === 0n) return transfer === null;
  if (transfer === null) return false;
  const trusted = trustedFeeAddresses.map((a) => a.toLowerCase());
  return (
    transfer.amountBaseUnits === quotedFee && trusted.includes(transfer.recipient.toLowerCase())
  );
}
