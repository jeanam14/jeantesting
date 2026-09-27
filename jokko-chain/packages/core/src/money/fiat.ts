/**
 * Fiat currencies shown in the app, and the exact conversions between them.
 *
 * XOF (UEMOA franc CFA) and XAF (CEMAC franc CFA) are both pegged to the euro at exactly
 * 655.957 francs per euro. That peg is a legal fixed parity, so it is a constant, not a market
 * feed. Only EUR/USD needs a live rate (see docs/05-providers-and-tools.md).
 */
import { parseRate, type ExactDecimal } from './decimal.js';

/** Currencies the app can display. */
export type FiatCurrency = 'XOF' | 'XAF' | 'EUR' | 'USD';

/** Static facts about a fiat currency. */
export interface FiatCurrencyInfo {
  /** ISO 4217 code. */
  readonly code: FiatCurrency;
  /**
   * ISO 4217 minor units: how many decimals the currency has. XOF and XAF have **zero**
   * (no centimes in circulation), so amounts are always whole francs.
   */
  readonly minorUnits: number;
  /** Symbol shown to users. Both CFA francs display as "FCFA". */
  readonly symbol: string;
}

/** Registry of supported fiat currencies. */
export const FIAT_CURRENCIES: Readonly<Record<FiatCurrency, FiatCurrencyInfo>> = {
  XOF: { code: 'XOF', minorUnits: 0, symbol: 'FCFA' },
  XAF: { code: 'XAF', minorUnits: 0, symbol: 'FCFA' },
  EUR: { code: 'EUR', minorUnits: 2, symbol: '€' },
  USD: { code: 'USD', minorUnits: 2, symbol: '$' },
};

/**
 * Fixed legal parity: 1 EUR = 655.957 XOF = 655.957 XAF.
 */
export const CFA_PER_EUR: ExactDecimal = parseRate('655.957');

/** Type guard for {@link FiatCurrency}. */
export function isFiatCurrency(value: string): value is FiatCurrency {
  return Object.hasOwn(FIAT_CURRENCIES, value);
}
