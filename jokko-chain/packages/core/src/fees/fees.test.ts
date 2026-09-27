import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { JokkoCoreError } from '../errors.js';
import { parseRate } from '../money/decimal.js';
import {
  assertValidFeeSchedule,
  computeFee,
  selectFeeSchedule,
  verifyFeeTransfer,
  type FeeSchedule,
} from './fees.js';

const base: FeeSchedule = {
  id: 'fs-base',
  product: 'send',
  action: null,
  network: null,
  assetSymbol: null,
  country: null,
  segment: null,
  pctBps: 50,
  fixedMinor: 100n,
  fixedCurrency: 'XOF',
  minMinor: 50n,
  maxMinor: 5_000n,
  priority: 0,
  effectiveFrom: new Date('2026-01-01T00:00:00Z'),
  effectiveTo: null,
};
const now = new Date('2026-10-01T12:00:00Z');
const usdcXof = parseRate('565');

describe('selectFeeSchedule', () => {
  it('returns null when nothing matches the product', () => {
    expect(selectFeeSchedule([base], { product: 'swap', at: now })).toBeNull();
  });

  it('prefers the most specific matching schedule', () => {
    const polygon: FeeSchedule = { ...base, id: 'fs-polygon', network: 'polygon', pctBps: 20 };
    const polygonUsdcSn: FeeSchedule = {
      ...base,
      id: 'fs-polygon-usdc-sn',
      network: 'polygon',
      assetSymbol: 'USDC',
      country: 'SN',
      pctBps: 10,
    };
    const all = [base, polygon, polygonUsdcSn];
    expect(selectFeeSchedule(all, { product: 'send', network: 'polygon', assetSymbol: 'USDC', country: 'SN', at: now })?.id).toBe('fs-polygon-usdc-sn');
    expect(selectFeeSchedule(all, { product: 'send', network: 'polygon', assetSymbol: 'USDC', country: 'CI', at: now })?.id).toBe('fs-polygon');
    expect(selectFeeSchedule(all, { product: 'send', network: 'ethereum', at: now })?.id).toBe('fs-base');
  });

  it('respects validity windows, segments, priority and deterministic tie-breaks', () => {
    const future: FeeSchedule = { ...base, id: 'fs-future', effectiveFrom: new Date('2027-01-01T00:00:00Z') };
    const expired: FeeSchedule = { ...base, id: 'fs-expired', network: 'polygon', effectiveTo: new Date('2026-06-01T00:00:00Z') };
    const promo: FeeSchedule = { ...base, id: 'fs-promo', segment: 'new_users', pctBps: 0 };
    const highPriority: FeeSchedule = { ...base, id: 'fs-high', priority: 5 };
    const twinA: FeeSchedule = { ...base, id: 'fs-a' };
    const twinB: FeeSchedule = { ...base, id: 'fs-b' };

    expect(selectFeeSchedule([future], { product: 'send', at: now })).toBeNull();
    expect(selectFeeSchedule([expired, base], { product: 'send', network: 'polygon', at: now })?.id).toBe('fs-base');
    expect(selectFeeSchedule([promo, base], { product: 'send', segments: ['new_users'], at: now })?.id).toBe('fs-promo');
    expect(selectFeeSchedule([promo, base], { product: 'send', at: now })?.id).toBe('fs-base');
    expect(selectFeeSchedule([base, highPriority], { product: 'send', at: now })?.id).toBe('fs-high');
    expect(selectFeeSchedule([twinB, twinA], { product: 'send', at: now })?.id).toBe('fs-a');
    const newer: FeeSchedule = { ...base, id: 'fs-z-newer', effectiveFrom: new Date('2026-05-01T00:00:00Z') };
    expect(selectFeeSchedule([base, newer], { product: 'send', at: now })?.id).toBe('fs-z-newer');
  });
});

describe('computeFee', () => {
  it('adds the percentage and fixed parts, rounding each down', () => {
    // 10 000 FCFA ≈ 17.70 USDC. 0.5 % = 0.0885 USDC; 100 FCFA = 0.176991 USDC.
    const fee = computeFee({ schedule: base, amountBaseUnits: 17_700_000n, assetDecimals: 6, pricePerAsset: usdcXof });
    expect(fee).toEqual({
      scheduleId: 'fs-base',
      percentagePart: 88_500n,
      fixedPart: 176_991n,
      total: 265_491n,
      clampedTo: null,
    });
  });

  it('applies the minimum', () => {
    const schedule: FeeSchedule = { ...base, pctBps: 0, fixedMinor: 0n };
    const fee = computeFee({ schedule, amountBaseUnits: 1n, assetDecimals: 6, pricePerAsset: usdcXof });
    expect(fee.total).toBe(88_495n); // 50 FCFA
    expect(fee.clampedTo).toBe('min');
  });

  it('applies the maximum', () => {
    const schedule: FeeSchedule = { ...base, pctBps: 10_000, fixedMinor: 0n, minMinor: null, maxMinor: 100n };
    const fee = computeFee({ schedule, amountBaseUnits: 1_000_000n, assetDecimals: 6, pricePerAsset: usdcXof });
    expect(fee.total).toBe(176_991n); // 100 FCFA
    expect(fee.clampedTo).toBe('max');
  });

  it('works with 18-decimal tokens', () => {
    const fee = computeFee({ schedule: { ...base, fixedMinor: 0n, minMinor: null }, amountBaseUnits: 10n ** 18n, assetDecimals: 18, pricePerAsset: usdcXof });
    expect(fee.total).toBe(5n * 10n ** 15n);
  });

  it('never exceeds the maximum and never goes below the minimum (property)', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 15n }), fc.integer({ min: 0, max: 10_000 }), (amount, pctBps) => {
        const schedule: FeeSchedule = { ...base, pctBps };
        const fee = computeFee({ schedule, amountBaseUnits: amount, assetDecimals: 6, pricePerAsset: usdcXof });
        expect(fee.total >= 88_495n).toBe(true);
        expect(fee.total <= 8_849_557n).toBe(true);
      }),
    );
  });

  it('rejects negative amounts', () => {
    expect(() => computeFee({ schedule: base, amountBaseUnits: -1n, assetDecimals: 6, pricePerAsset: usdcXof })).toThrow(JokkoCoreError);
  });
});

describe('assertValidFeeSchedule', () => {
  it.each([
    [{ pctBps: -1 }],
    [{ pctBps: 10_001 }],
    [{ pctBps: 1.5 }],
    [{ fixedMinor: -1n }],
    [{ minMinor: -1n }],
    [{ maxMinor: -1n }],
    [{ minMinor: 10n, maxMinor: 5n }],
    [{ effectiveTo: new Date('2025-01-01T00:00:00Z') }],
  ])('rejects %o', (patch) => {
    expect(() => assertValidFeeSchedule({ ...base, ...patch })).toThrow(JokkoCoreError);
  });

  it('accepts a valid schedule', () => {
    expect(() => assertValidFeeSchedule(base)).not.toThrow();
  });
});

describe('verifyFeeTransfer (anti-tampering, T19)', () => {
  const trusted = ['0xFeE0000000000000000000000000000000000001'];

  it('accepts exactly the quoted fee to a trusted address (case-insensitive)', () => {
    expect(verifyFeeTransfer(265_491n, { recipient: '0xfee0000000000000000000000000000000000001', amountBaseUnits: 265_491n }, trusted)).toBe(true);
  });

  it('rejects a different amount, an unknown recipient or a missing transfer', () => {
    expect(verifyFeeTransfer(265_491n, { recipient: trusted[0]!, amountBaseUnits: 265_492n }, trusted)).toBe(false);
    expect(verifyFeeTransfer(265_491n, { recipient: '0x000000000000000000000000000000000000dEaD', amountBaseUnits: 265_491n }, trusted)).toBe(false);
    expect(verifyFeeTransfer(265_491n, null, trusted)).toBe(false);
  });

  it('with no quoted fee, requires no fee transfer at all', () => {
    expect(verifyFeeTransfer(0n, null, trusted)).toBe(true);
    expect(verifyFeeTransfer(0n, { recipient: trusted[0]!, amountBaseUnits: 1n }, trusted)).toBe(false);
  });
});
