/**
 * User-facing number formatting for French and English (D20, design/README.md §3).
 *
 * French: `12 500 FCFA`, `250,00 USDC`, `+1,2 %` (narrow no-break space U+202F for grouping,
 * no-break space U+00A0 before units).
 * English: `12,500 FCFA`, `250.00 USDC`, `+1.2%`.
 *
 * Formatting never uses floating point: it works on the exact decimal string.
 */
import { formatUnits, mulDiv, pow10, type RoundingMode } from './decimal.js';
import { FIAT_CURRENCIES, type FiatCurrency } from './fiat.js';

/** Languages supported by the app. */
export type Locale = 'fr' | 'en';

/** Narrow no-break space: French thousands separator. */
export const NARROW_NBSP = '\u202f';
/** No-break space: between a number and its unit in French. */
export const NBSP = '\u00a0';

/** Options for {@link formatAmount}. */
export interface FormatAmountOptions {
  /** Output language. */
  readonly locale: Locale;
  /** Maximum decimals shown (the value is rounded with `rounding`). */
  readonly maxFractionDigits: number;
  /** Minimum decimals shown (pads with zeros, e.g. `250,00`). Defaults to 0. */
  readonly minFractionDigits?: number;
  /** Rounding for hidden digits. Defaults to `down` so a balance is never overstated. */
  readonly rounding?: RoundingMode;
}

/**
 * Formats an amount of base units for display, e.g. `250000000n` (6 decimals) →
 * `"250,00"` (fr) / `"250.00"` (en) with `minFractionDigits: 2`.
 */
export function formatAmount(
  amountBaseUnits: bigint,
  decimals: number,
  options: FormatAmountOptions,
): string {
  const { locale, maxFractionDigits, minFractionDigits = 0, rounding = 'down' } = options;
  const negative = amountBaseUnits < 0n;
  let abs = negative ? -amountBaseUnits : amountBaseUnits;
  let shownDecimals = decimals;
  if (maxFractionDigits < decimals) {
    abs = mulDiv(abs, 1n, pow10(decimals - maxFractionDigits), rounding);
    shownDecimals = maxFractionDigits;
  }
  const exact = formatUnits(abs, shownDecimals);
  const [whole = '0', fraction = ''] = exact.split('.');
  const paddedFraction = fraction.padEnd(Math.min(minFractionDigits, shownDecimals), '0');
  const group = locale === 'fr' ? NARROW_NBSP : ',';
  const decimalSeparator = locale === 'fr' ? ',' : '.';
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const text =
    paddedFraction.length > 0
      ? `${groupedWhole}${decimalSeparator}${paddedFraction}`
      : groupedWhole;
  return negative ? `\u2212${text}` : text;
}

/**
 * Formats a fiat value in minor units with its currency, following each currency's official
 * number of decimals.
 *
 * @example formatFiat(12500n, 'XOF', 'fr') === '12 500 FCFA'
 * @example formatFiat(12500n, 'XOF', 'en') === '12,500 FCFA'
 * @example formatFiat(123456n, 'EUR', 'fr') === '1 234,56 €'
 * @example formatFiat(123456n, 'USD', 'en') === '$1,234.56'
 */
export function formatFiat(minor: bigint, currency: FiatCurrency, locale: Locale): string {
  const info = FIAT_CURRENCIES[currency];
  const number = formatAmount(minor, info.minorUnits, {
    locale,
    maxFractionDigits: info.minorUnits,
    minFractionDigits: info.minorUnits,
  });
  if (currency === 'XOF' || currency === 'XAF') {
    return `${number}${locale === 'fr' ? NBSP : ' '}${info.symbol}`;
  }
  if (locale === 'fr') {
    return `${number}${NBSP}${info.symbol}`;
  }
  return number.startsWith('\u2212')
    ? `\u2212${info.symbol}${number.slice(1)}`
    : `${info.symbol}${number}`;
}

/**
 * Formats a percentage given in basis points (1 bp = 0.01 %), e.g. `120` → `"+1,2 %"` (fr)
 * or `"+1.2%"` (en). `signed` adds `+` for positive values (used for price changes).
 */
export function formatBasisPoints(bps: bigint, locale: Locale, signed = false): string {
  const negative = bps < 0n;
  const abs = negative ? -bps : bps;
  const number = formatAmount(abs, 2, { locale, maxFractionDigits: 2, minFractionDigits: 1 });
  const sign = negative ? '\u2212' : signed && abs > 0n ? '+' : '';
  return locale === 'fr' ? `${sign}${number}${NARROW_NBSP}%` : `${sign}${number}%`;
}
