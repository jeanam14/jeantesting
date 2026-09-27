/**
 * Exact decimal arithmetic on `bigint`.
 *
 * WHY THIS EXISTS: money and crypto amounts must never touch floating point (CLAUDE.md,
 * "Cross-cutting technical rules"). `0.1 + 0.2 !== 0.3` in JavaScript, and a wallet that rounds
 * the wrong way even once loses trust. Every amount in Jokko Chain is therefore an integer
 * number of the smallest unit (wei, lamports, satoshis, sun, FCFA francs, cents), stored as
 * `bigint`, and every decimal string is converted with the exact functions below.
 */
import { JokkoCoreError } from '../errors.js';

/** How to round when an exact result is not representable. */
export type RoundingMode =
  /** Toward zero. Used for fees and displayed balances: never in Jokko's favour. */
  | 'down'
  /** Away from zero. */
  | 'up'
  /** To nearest, ties to even (banker's rounding). Used for statistics, never for money moved. */
  | 'half-even';

/** Largest number of digits accepted in an amount string (uint256 has 78 digits). */
const MAX_DIGITS = 78;
/** Largest supported number of decimals (ERC-20 tokens use at most 18; margin for rates). */
const MAX_DECIMALS = 36;

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/**
 * Throws unless `decimals` is an integer between 0 and {@link MAX_DECIMALS}.
 */
export function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new JokkoCoreError('INVALID_DECIMALS', `decimals must be an integer 0..${MAX_DECIMALS}`);
  }
}

/** `10n ** exponent`, with the exponent validated. */
export function pow10(exponent: number): bigint {
  assertDecimals(exponent);
  return 10n ** BigInt(exponent);
}

/**
 * Converts a canonical decimal string (e.g. `"12.5"`) into an integer amount of base units.
 *
 * Accepts only ASCII digits with an optional single `.`: no sign, no exponent, no grouping,
 * no whitespace. Locale input such as `"12 500,50"` must first go through
 * {@link normalizeLocaleNumber}.
 *
 * **Never rounds.** More fractional digits than `decimals` is an error, because silently
 * dropping digits would change the amount the user typed.
 *
 * @example parseUnits('1.5', 6) === 1_500_000n
 */
export function parseUnits(value: string, decimals: number): bigint {
  assertDecimals(decimals);
  if (typeof value !== 'string') {
    throw new JokkoCoreError('INVALID_AMOUNT', 'amount must be a string');
  }
  if (value.startsWith('-')) {
    throw new JokkoCoreError('NEGATIVE_AMOUNT', 'amount must not be negative');
  }
  const match = DECIMAL_PATTERN.exec(value);
  if (!match) {
    throw new JokkoCoreError('INVALID_AMOUNT', `not a decimal number: "${value}"`);
  }
  const whole = match[1] ?? '0';
  const fraction = match[2] ?? '';
  if (whole.length + fraction.length > MAX_DIGITS) {
    throw new JokkoCoreError('INVALID_AMOUNT', 'amount has too many digits');
  }
  if (fraction.length > decimals) {
    // Allow trailing zeros beyond the precision ("1.500000" for a 2-decimal currency is fine).
    const significant = fraction.slice(decimals);
    if (!/^0*$/.test(significant)) {
      throw new JokkoCoreError(
        'TOO_MANY_DECIMALS',
        `amount has more than ${decimals} decimal places`,
      );
    }
  }
  const paddedFraction = fraction.slice(0, decimals).padEnd(decimals, '0');
  return BigInt(whole + paddedFraction);
}

/**
 * Converts an integer amount of base units back into its exact canonical decimal string.
 * Trailing fractional zeros are removed (`1_500_000n` with 6 decimals → `"1.5"`).
 *
 * This is the exact representation used in APIs and storage, not a display format: see
 * `formatAmount` in `format.ts` for user-facing text.
 */
export function formatUnits(amount: bigint, decimals: number): string {
  assertDecimals(decimals);
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const digits = abs.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');
  const text = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `-${text}` : text;
}

/**
 * Computes `(a × b) ÷ c` exactly on non-negative integers, then rounds.
 * The multiplication happens before the division so no precision is lost.
 */
export function mulDiv(a: bigint, b: bigint, c: bigint, rounding: RoundingMode): bigint {
  if (c === 0n) {
    throw new JokkoCoreError('DIVISION_BY_ZERO', 'division by zero');
  }
  if (a < 0n || b < 0n || c < 0n) {
    throw new JokkoCoreError('NEGATIVE_AMOUNT', 'mulDiv expects non-negative operands');
  }
  const numerator = a * b;
  const quotient = numerator / c;
  const remainder = numerator % c;
  if (remainder === 0n) return quotient;
  switch (rounding) {
    case 'down':
      return quotient;
    case 'up':
      return quotient + 1n;
    case 'half-even': {
      const twice = remainder * 2n;
      if (twice > c) return quotient + 1n;
      if (twice < c) return quotient;
      return quotient % 2n === 0n ? quotient : quotient + 1n;
    }
  }
}

/**
 * A positive decimal number held exactly as `units / 10^scale`. Used for prices and exchange
 * rates (e.g. "1 USDC = 565.25 FCFA"), which are not amounts of any asset.
 */
export interface ExactDecimal {
  /** Integer mantissa. */
  readonly units: bigint;
  /** Number of decimal places the mantissa is scaled by. */
  readonly scale: number;
}

/**
 * Parses a price or rate such as `"655.957"` into an {@link ExactDecimal}. Rejects zero,
 * negative and malformed values: a zero rate would turn any amount into infinity.
 */
export function parseRate(value: string): ExactDecimal {
  const match = DECIMAL_PATTERN.exec(value);
  if (!match) {
    throw new JokkoCoreError('INVALID_RATE', `not a positive decimal rate: "${value}"`);
  }
  const fraction = (match[2] ?? '').replace(/0+$/, '');
  if (fraction.length > MAX_DECIMALS) {
    throw new JokkoCoreError('INVALID_RATE', 'rate has too many decimal places');
  }
  const units = BigInt((match[1] ?? '0') + fraction);
  if (units === 0n) {
    throw new JokkoCoreError('INVALID_RATE', 'rate must be greater than zero');
  }
  return { units, scale: fraction.length };
}

/** Canonical string form of an {@link ExactDecimal} (inverse of {@link parseRate}). */
export function formatRate(rate: ExactDecimal): string {
  return formatUnits(rate.units, rate.scale);
}

/**
 * Turns a locale-formatted number typed by a user into the canonical form accepted by
 * {@link parseUnits}.
 *
 * - French: `"12 500,50"` or `"12 500,50"` (narrow no-break space) → `"12500.50"`
 * - English: `"12,500.50"` → `"12500.50"`
 *
 * Returns `null` when the text is not a valid number in that locale (e.g. two decimal
 * separators), so the UI can show a validation error instead of guessing.
 */
export function normalizeLocaleNumber(text: string, locale: 'fr' | 'en'): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const groupSeparators = locale === 'fr' ? /[\s\u00a0\u202f.]/g : /[\s,]/g;
  const decimalSeparator = locale === 'fr' ? ',' : '.';
  const withoutGroups = trimmed.replace(groupSeparators, '');
  const parts = withoutGroups.split(decimalSeparator);
  if (parts.length > 2) return null;
  const canonical = parts.length === 2 ? `${parts[0]}.${parts[1]}` : (parts[0] ?? '');
  return DECIMAL_PATTERN.test(canonical) ? canonical : null;
}

/**
 * Multiplies two exact decimals (e.g. USD price × EUR/USD rate × XOF/EUR parity). The result is
 * truncated (rounded toward zero) to at most `maxScale` decimal places so chained conversions
 * cannot grow without bound. Truncation errs on the side of showing the user a slightly lower
 * value, never a higher one.
 */
export function multiplyDecimals(a: ExactDecimal, b: ExactDecimal, maxScale = 18): ExactDecimal {
  assertDecimals(maxScale);
  let units = a.units * b.units;
  let scale = a.scale + b.scale;
  if (scale > maxScale) {
    units /= pow10(scale - maxScale);
    scale = maxScale;
  }
  return { units, scale };
}

const JSON_NUMBER = /^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d{1,3}))?$/;

/**
 * Converts the SOURCE TEXT of a positive JSON number (e.g. `"0.9998"`, `"1e-7"`, `"6.5E+4"`)
 * into an exact decimal without ever going through a float. Providers such as price APIs send
 * prices as JSON numbers; reading them with `JSON.parse` alone would silently turn them into
 * floats, so adapters capture the source text instead (JSON.parse reviver `context.source`).
 */
export function parseJsonNumberText(text: string): ExactDecimal {
  const match = JSON_NUMBER.exec(text);
  if (!match) throw new JokkoCoreError('INVALID_RATE', `not a positive JSON number: "${text}"`);
  const integer = match[1] ?? '';
  const fraction = match[2] ?? '';
  const exponent = Number(match[3] ?? '0');
  let units = BigInt(`${integer}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    units *= pow10(-scale);
    scale = 0;
  }
  if (scale > MAX_DECIMALS) {
    throw new JokkoCoreError('INVALID_RATE', 'number has too many decimal places');
  }
  if (units === 0n) throw new JokkoCoreError('INVALID_RATE', 'rate must be positive');
  return { units, scale };
}
