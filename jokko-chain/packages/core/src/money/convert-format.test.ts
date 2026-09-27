import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { JokkoCoreError } from '../errors.js';
import { assetToFiat, fiatToAsset } from './convert.js';
import { parseRate } from './decimal.js';
import { CFA_PER_EUR, isFiatCurrency } from './fiat.js';
import { formatAmount, formatBasisPoints, formatFiat, NARROW_NBSP, NBSP } from './format.js';

describe('assetToFiat / fiatToAsset', () => {
  const usdcXof = parseRate('565');

  it('converts USDC to XOF (0 decimals) exactly', () => {
    expect(assetToFiat(250_000_000n, 6, usdcXof, 'XOF')).toBe(141_250n);
    expect(assetToFiat(17_700_000n, 6, usdcXof, 'XOF')).toBe(10_000n);
  });

  it('converts to currencies with cents', () => {
    expect(assetToFiat(1_500_000n, 6, parseRate('1.08'), 'EUR')).toBe(162n);
  });

  it('converts XOF back to USDC, rounding down so the user never pays more', () => {
    // 10 000 / 565 = 17.69911504… USDC
    expect(fiatToAsset(10_000n, 'XOF', usdcXof, 6)).toBe(17_699_115n);
    expect(fiatToAsset(10_000n, 'XOF', usdcXof, 6, 'up')).toBe(17_699_116n);
  });

  it('handles 18-decimal tokens (USDT on BNB Chain)', () => {
    expect(assetToFiat(10n ** 18n, 18, usdcXof, 'XOF')).toBe(565n);
  });

  it('rejects negative amounts', () => {
    expect(() => assetToFiat(-1n, 6, usdcXof, 'XOF')).toThrow(JokkoCoreError);
    expect(() => fiatToAsset(-1n, 'XOF', usdcXof, 6)).toThrow(JokkoCoreError);
  });

  it('converting to fiat and back never creates value (property)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 24n }),
        fc.integer({ min: 1, max: 10_000_000 }),
        (amount, priceMilli) => {
          const price = parseRate((priceMilli / 1000).toFixed(3));
          const fiat = assetToFiat(amount, 6, price, 'XOF');
          const back = fiatToAsset(fiat, 'XOF', price, 6);
          expect(back <= amount).toBe(true);
        },
      ),
    );
  });
});

describe('fiat currencies', () => {
  it('pins the legal CFA/EUR parity', () => {
    expect(CFA_PER_EUR).toEqual({ units: 655_957n, scale: 3 });
  });

  it('recognises supported codes', () => {
    expect(isFiatCurrency('XOF')).toBe(true);
    expect(isFiatCurrency('GHS')).toBe(false);
    expect(isFiatCurrency('toString')).toBe(false);
  });
});

describe('formatting', () => {
  it('formats FCFA with no decimals in both languages', () => {
    expect(formatFiat(12_500n, 'XOF', 'fr')).toBe(`12${NARROW_NBSP}500${NBSP}FCFA`);
    expect(formatFiat(12_500n, 'XOF', 'en')).toBe('12,500 FCFA');
    expect(formatFiat(1_127n, 'XAF', 'fr')).toBe(`1${NARROW_NBSP}127${NBSP}FCFA`);
    expect(formatFiat(0n, 'XOF', 'en')).toBe('0 FCFA');
  });

  it('formats euros and dollars with cents', () => {
    expect(formatFiat(123_456n, 'EUR', 'fr')).toBe(`1${NARROW_NBSP}234,56${NBSP}€`);
    expect(formatFiat(123_456n, 'USD', 'en')).toBe('$1,234.56');
    expect(formatFiat(5n, 'USD', 'en')).toBe('$0.05');
    expect(formatFiat(-500n, 'USD', 'en')).toBe('\u2212$5.00');
  });

  it('formats token amounts with bounded decimals, rounding down', () => {
    expect(
      formatAmount(250_000_000n, 6, { locale: 'fr', maxFractionDigits: 2, minFractionDigits: 2 }),
    ).toBe('250,00');
    expect(formatAmount(1_234_567_890n, 6, { locale: 'fr', maxFractionDigits: 2 })).toBe(
      `1${NARROW_NBSP}234,56`,
    );
    expect(formatAmount(1_234_567_890n, 6, { locale: 'en', maxFractionDigits: 2 })).toBe(
      '1,234.56',
    );
    expect(formatAmount(4_500_000_000_000_000n, 18, { locale: 'fr', maxFractionDigits: 4 })).toBe(
      '0,0045',
    );
    expect(formatAmount(-1_000_000n, 6, { locale: 'en', maxFractionDigits: 2 })).toBe('\u22121');
  });

  it('formats percentages from basis points', () => {
    expect(formatBasisPoints(120n, 'fr', true)).toBe(`+1,2${NARROW_NBSP}%`);
    expect(formatBasisPoints(120n, 'en', true)).toBe('+1.2%');
    expect(formatBasisPoints(-80n, 'fr')).toBe(`\u22120,8${NARROW_NBSP}%`);
    expect(formatBasisPoints(0n, 'en', true)).toBe('0.0%');
    expect(formatBasisPoints(650n, 'en')).toBe('6.5%');
  });
});
