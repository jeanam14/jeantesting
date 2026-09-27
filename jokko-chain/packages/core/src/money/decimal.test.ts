import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { JokkoCoreError } from '../errors.js';
import {
  formatRate,
  formatUnits,
  mulDiv,
  multiplyDecimals,
  normalizeLocaleNumber,
  parseJsonNumberText,
  parseRate,
  parseUnits,
  pow10,
} from './decimal.js';

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof JokkoCoreError ? error.code : 'OTHER';
  }
  return undefined;
}

describe('parseUnits', () => {
  it('converts decimal strings to base units exactly', () => {
    expect(parseUnits('1.5', 6)).toBe(1_500_000n);
    expect(parseUnits('0.000001', 6)).toBe(1n);
    expect(parseUnits('250', 6)).toBe(250_000_000n);
    expect(parseUnits('12500', 0)).toBe(12_500n);
    expect(parseUnits('0', 18)).toBe(0n);
    expect(parseUnits('1', 18)).toBe(10n ** 18n);
  });

  it('accepts trailing zeros beyond the precision but never rounds significant digits', () => {
    expect(parseUnits('1.1200000', 2)).toBe(112n);
    expect(codeOf(() => parseUnits('1.1234567', 6))).toBe('TOO_MANY_DECIMALS');
    expect(codeOf(() => parseUnits('0.5', 0))).toBe('TOO_MANY_DECIMALS');
  });

  it('rejects anything that is not a plain non-negative decimal', () => {
    for (const bad of ['', ' 1', '1 ', '1e5', '.5', '5.', '1.2.3', '0x10', 'abc', '1,5', '+1']) {
      expect(
        codeOf(() => parseUnits(bad, 6)),
        bad,
      ).toBe('INVALID_AMOUNT');
    }
    expect(codeOf(() => parseUnits('-1', 6))).toBe('NEGATIVE_AMOUNT');
    expect(codeOf(() => parseUnits('1'.repeat(79), 0))).toBe('INVALID_AMOUNT');
  });

  it('rejects invalid decimals', () => {
    expect(codeOf(() => parseUnits('1', -1))).toBe('INVALID_DECIMALS');
    expect(codeOf(() => parseUnits('1', 1.5))).toBe('INVALID_DECIMALS');
    expect(codeOf(() => parseUnits('1', 37))).toBe('INVALID_DECIMALS');
  });
});

describe('formatUnits', () => {
  it('produces the canonical decimal string', () => {
    expect(formatUnits(1_500_000n, 6)).toBe('1.5');
    expect(formatUnits(1n, 6)).toBe('0.000001');
    expect(formatUnits(250_000_000n, 6)).toBe('250');
    expect(formatUnits(0n, 6)).toBe('0');
    expect(formatUnits(12_500n, 0)).toBe('12500');
    expect(formatUnits(-1_500_000n, 6)).toBe('-1.5');
  });

  it('round-trips with parseUnits for any amount and precision (property)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 2n ** 256n - 1n }),
        fc.integer({ min: 0, max: 18 }),
        (amount, decimals) => {
          expect(parseUnits(formatUnits(amount, decimals), decimals)).toBe(amount);
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe('mulDiv', () => {
  it('rounds according to the requested mode', () => {
    expect(mulDiv(10n, 1n, 3n, 'down')).toBe(3n);
    expect(mulDiv(10n, 1n, 3n, 'up')).toBe(4n);
    expect(mulDiv(9n, 1n, 3n, 'up')).toBe(3n);
    expect(mulDiv(10n, 1n, 4n, 'half-even')).toBe(2n);
    expect(mulDiv(14n, 1n, 4n, 'half-even')).toBe(4n);
    expect(mulDiv(11n, 1n, 4n, 'half-even')).toBe(3n);
    expect(mulDiv(9n, 1n, 4n, 'half-even')).toBe(2n);
  });

  it('refuses division by zero and negative operands', () => {
    expect(codeOf(() => mulDiv(1n, 1n, 0n, 'down'))).toBe('DIVISION_BY_ZERO');
    expect(codeOf(() => mulDiv(-1n, 1n, 1n, 'down'))).toBe('NEGATIVE_AMOUNT');
  });

  it('never exceeds the exact result when rounding down (property)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 30n }),
        fc.bigInt({ min: 0n, max: 10n ** 30n }),
        fc.bigInt({ min: 1n, max: 10n ** 30n }),
        (a, b, c) => {
          const q = mulDiv(a, b, c, 'down');
          expect(q * c <= a * b).toBe(true);
          expect((q + 1n) * c > a * b).toBe(true);
        },
      ),
    );
  });
});

describe('rates', () => {
  it('parses and formats exact rates', () => {
    expect(parseRate('655.957')).toEqual({ units: 655_957n, scale: 3 });
    expect(parseRate('565.2500')).toEqual({ units: 56_525n, scale: 2 });
    expect(formatRate(parseRate('0.9995'))).toBe('0.9995');
  });

  it('rejects zero, negative and malformed rates', () => {
    expect(codeOf(() => parseRate('0'))).toBe('INVALID_RATE');
    expect(codeOf(() => parseRate('0.000'))).toBe('INVALID_RATE');
    expect(codeOf(() => parseRate('-1'))).toBe('INVALID_RATE');
    expect(codeOf(() => parseRate('abc'))).toBe('INVALID_RATE');
    expect(codeOf(() => parseRate(`0.${'1'.repeat(37)}`))).toBe('INVALID_RATE');
  });
});

describe('normalizeLocaleNumber', () => {
  it('handles French grouping and decimal comma', () => {
    expect(normalizeLocaleNumber('12 500,50', 'fr')).toBe('12500.50');
    expect(normalizeLocaleNumber('12\u202f500', 'fr')).toBe('12500');
    expect(normalizeLocaleNumber('12\u00a0500,5', 'fr')).toBe('12500.5');
  });

  it('handles English grouping and decimal point', () => {
    expect(normalizeLocaleNumber('12,500.50', 'en')).toBe('12500.50');
    expect(normalizeLocaleNumber('0.5', 'en')).toBe('0.5');
  });

  it('returns null for ambiguous or invalid input', () => {
    expect(normalizeLocaleNumber('1,2,3', 'fr')).toBeNull();
    expect(normalizeLocaleNumber('abc', 'en')).toBeNull();
    expect(normalizeLocaleNumber('   ', 'en')).toBeNull();
    expect(normalizeLocaleNumber('-5', 'en')).toBeNull();
  });
});

describe('pow10', () => {
  it('computes powers of ten', () => {
    expect(pow10(0)).toBe(1n);
    expect(pow10(6)).toBe(1_000_000n);
  });
});

describe('multiplyDecimals', () => {
  it('multiplies exactly within the scale limit', () => {
    const r = multiplyDecimals(parseRate('1.5'), parseRate('655.957'));
    expect(formatRate(r)).toBe('983.9355');
  });
  it('truncates toward zero beyond maxScale', () => {
    const r = multiplyDecimals(parseRate('0.333'), parseRate('0.333'), 4);
    expect(formatRate(r)).toBe('0.1108');
  });
});

describe('parseJsonNumberText', () => {
  it.each([
    ['0.9998', '0.9998'],
    ['1e-7', '0.0000001'],
    ['6.5E+4', '65000'],
    ['42', '42'],
    ['1.25e2', '125'],
  ])('%s → %s', (input, expected) => {
    expect(formatRate(parseJsonNumberText(input))).toBe(expected);
  });
  it.each(['-1', '0', 'abc', '1.', '.5', '1e400'])('rejects %s', (input) => {
    expect(() => parseJsonNumberText(input)).toThrow(JokkoCoreError);
  });
});
