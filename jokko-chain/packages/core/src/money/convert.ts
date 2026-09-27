/**
 * Exact conversions between crypto amounts and fiat values.
 *
 * A price is expressed as "fiat per ONE whole asset unit" (e.g. 1 USDC = 565.25 XOF). Amounts
 * are integers in base units on both sides, so every conversion is a single exact
 * {@link mulDiv} with an explicit rounding mode.
 */
import { JokkoCoreError } from '../errors.js';
import { mulDiv, pow10, type ExactDecimal, type RoundingMode } from './decimal.js';
import { FIAT_CURRENCIES, type FiatCurrency } from './fiat.js';

/**
 * Converts an asset amount (base units) into fiat minor units.
 *
 * fiatMinor = amount × price × 10^fiatMinorUnits ÷ 10^assetDecimals
 *
 * @example 250 USDC (250_000_000n, 6 decimals) at 565 XOF → 141_250n XOF
 */
export function assetToFiat(
  amountBaseUnits: bigint,
  assetDecimals: number,
  pricePerAsset: ExactDecimal,
  currency: FiatCurrency,
  rounding: RoundingMode = 'down',
): bigint {
  if (amountBaseUnits < 0n) {
    throw new JokkoCoreError('NEGATIVE_AMOUNT', 'amount must not be negative');
  }
  const fiatScale = pow10(FIAT_CURRENCIES[currency].minorUnits);
  const numeratorFactor = pricePerAsset.units * fiatScale;
  const denominator = pow10(assetDecimals) * pow10(pricePerAsset.scale);
  return mulDiv(amountBaseUnits, numeratorFactor, denominator, rounding);
}

/**
 * Converts fiat minor units into an asset amount in base units (inverse of {@link assetToFiat}).
 *
 * amount = fiatMinor × 10^assetDecimals × 10^priceScale ÷ (10^fiatMinorUnits × priceUnits)
 *
 * Rounds `down` by default: when converting a fixed fee in FCFA into tokens, the user never
 * pays more than the stated FCFA amount.
 */
export function fiatToAsset(
  fiatMinor: bigint,
  currency: FiatCurrency,
  pricePerAsset: ExactDecimal,
  assetDecimals: number,
  rounding: RoundingMode = 'down',
): bigint {
  if (fiatMinor < 0n) {
    throw new JokkoCoreError('NEGATIVE_AMOUNT', 'amount must not be negative');
  }
  const numeratorFactor = pow10(assetDecimals) * pow10(pricePerAsset.scale);
  const denominator = pow10(FIAT_CURRENCIES[currency].minorUnits) * pricePerAsset.units;
  return mulDiv(fiatMinor, numeratorFactor, denominator, rounding);
}
