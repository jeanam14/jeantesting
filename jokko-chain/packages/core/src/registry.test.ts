import { describe, expect, it } from 'vitest';
import { JokkoCoreError } from './errors.js';
import {
  ASSETS,
  assetsPendingReview,
  availableAssets,
  findAssetByContract,
  getAsset,
} from './assets/assets.js';
import {
  effectiveCapabilities,
  invalidEnableOverrides,
  STATIC_CAPABILITIES,
} from './capabilities/capabilities.js';
import {
  explorerTxUrl,
  getNetwork,
  isNetworkKey,
  NETWORK_KEYS,
  NETWORKS,
  networksInFamily,
} from './networks/networks.js';
import { maskPhoneNumber, parsePhoneNumber, UEMOA_COUNTRIES } from './phone/phone.js';
import {
  evaluateSecurity,
  needsLargeSendConfirmation,
  securityLevel,
} from './security/security-levels.js';

describe('networks', () => {
  it('lists the six launch networks (D15)', () => {
    expect([...NETWORK_KEYS].sort()).toEqual(['bitcoin', 'bsc', 'ethereum', 'polygon', 'solana', 'tron']);
  });

  it('groups Ethereum, Polygon and BNB Chain under one EVM family', () => {
    expect(networksInFamily('evm').map((n) => n.key).sort()).toEqual(['bsc', 'ethereum', 'polygon']);
  });

  it('has unique EVM chain IDs per environment', () => {
    for (const env of ['mainnet', 'testnet'] as const) {
      const ids = NETWORK_KEYS.map((k) => NETWORKS[k].deployments[env].evmChainId).filter((id) => id !== undefined);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('only EVM networks support EIP-7702', () => {
    for (const key of NETWORK_KEYS) {
      expect(NETWORKS[key].supportsEip7702).toBe(NETWORKS[key].family === 'evm');
    }
  });

  it('builds explorer links and validates keys', () => {
    expect(explorerTxUrl('polygon', 'testnet', '0xabc')).toBe('https://amoy.polygonscan.com/tx/0xabc');
    expect(isNetworkKey('polygon')).toBe(true);
    expect(isNetworkKey('arbitrum')).toBe(false);
    expect(() => getNetwork('arbitrum')).toThrow(JokkoCoreError);
    expect(getNetwork('tron').label.fr).toBe('Tron (TRC20)');
  });
});

describe('assets', () => {
  it('has unique ids and a network that exists', () => {
    expect(new Set(ASSETS.map((a) => a.id)).size).toBe(ASSETS.length);
    for (const asset of ASSETS) expect(isNetworkKey(asset.network)).toBe(true);
  });

  it('records that BNB Chain stablecoins use 18 decimals', () => {
    expect(getAsset('usdt:bsc').decimals).toBe(18);
    expect(getAsset('usdc:bsc').decimals).toBe(18);
    expect(getAsset('usdc:polygon').decimals).toBe(6);
  });

  it('keeps unreviewed token contracts off mainnet', () => {
    const mainnet = availableAssets('mainnet');
    for (const asset of mainnet) {
      expect(asset.kind === 'native' || asset.review.status === 'reviewed').toBe(true);
    }
    expect(assetsPendingReview().length).toBeGreaterThan(0);
    expect(availableAssets('testnet').some((a) => a.id === 'usdc:polygon')).toBe(true);
    expect(availableAssets('testnet').some((a) => a.id === 'usdt:tron')).toBe(false);
  });

  it('finds allowlisted tokens by contract and ignores unknown ones', () => {
    expect(findAssetByContract('ethereum', 'mainnet', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')?.id).toBe('usdc:ethereum');
    expect(findAssetByContract('tron', 'mainnet', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')?.id).toBe('usdt:tron');
    expect(findAssetByContract('polygon', 'mainnet', '0x000000000000000000000000000000000000dEaD')).toBeUndefined();
    expect(() => getAsset('doge:ethereum')).toThrow(JokkoCoreError);
  });
});

describe('capabilities', () => {
  it('matches the launch decisions (D16: staking ETH + SOL only)', () => {
    expect(STATIC_CAPABILITIES.ethereum.stake).toBe(true);
    expect(STATIC_CAPABILITIES.solana.stake).toBe(true);
    expect(STATIC_CAPABILITIES.polygon.stake).toBe(false);
    expect(STATIC_CAPABILITIES.bitcoin.gasless).toBe(false);
    for (const key of NETWORK_KEYS) expect(STATIC_CAPABILITIES[key].borrow).toBe(false);
  });

  it('lets the server disable but never enable beyond the code', () => {
    const overrides = [
      { network: 'polygon' as const, capability: 'swap' as const, enabled: false },
      { network: 'polygon' as const, capability: 'borrow' as const, enabled: true },
    ];
    const effective = effectiveCapabilities(overrides);
    expect(effective.polygon.swap).toBe(false);
    expect(effective.polygon.borrow).toBe(false);
    expect(effective.ethereum.swap).toBe(true);
    expect(invalidEnableOverrides(overrides)).toEqual([overrides[1]]);
    // The static map itself is never mutated.
    expect(STATIC_CAPABILITIES.polygon.swap).toBe(true);
  });
});

describe('security levels (D13)', () => {
  const none = { emailVerified: false, passkeyEnrolled: false, cloudBackupEnabled: false };
  const level2 = { emailVerified: true, passkeyEnrolled: true, cloudBackupEnabled: false };

  it('computes the level from the setup', () => {
    expect(securityLevel(none)).toBe(1);
    expect(securityLevel({ ...none, emailVerified: true })).toBe(1);
    expect(securityLevel(level2)).toBe(2);
    expect(securityLevel({ ...level2, cloudBackupEnabled: true })).toBe(3);
  });

  it('prompts from 50 000 FCFA and requires a passkey to send from 250 000 FCFA', () => {
    expect(evaluateSecurity(49_999n, none).prompts).toEqual([]);
    expect(evaluateSecurity(50_000n, none)).toEqual({ level: 1, prompts: ['add_passkey', 'add_email'], passkeyRequiredToSend: false });
    expect(evaluateSecurity(250_000n, none).passkeyRequiredToSend).toBe(true);
    expect(evaluateSecurity(250_000n, level2).passkeyRequiredToSend).toBe(false);
    expect(evaluateSecurity(1_000_000n, level2).prompts).toEqual(['enable_backup']);
  });

  it('flags large single sends', () => {
    expect(needsLargeSendConfirmation(499_999n)).toBe(false);
    expect(needsLargeSendConfirmation(500_000n)).toBe(true);
  });
});

describe('phone numbers', () => {
  it('normalises Senegalese and Ivorian mobile numbers to E.164', () => {
    expect(parsePhoneNumber('77 123 45 67', 'SN', UEMOA_COUNTRIES).e164).toBe('+221771234567');
    expect(parsePhoneNumber('+225 07 12 34 56 78', 'SN', UEMOA_COUNTRIES)).toMatchObject({ e164: '+2250712345678', country: 'CI' });
  });

  it('rejects invalid numbers and unsupported countries', () => {
    expect(() => parsePhoneNumber('123', 'SN', UEMOA_COUNTRIES)).toThrow(JokkoCoreError);
    expect(() => parsePhoneNumber('+33 6 12 34 56 78', 'SN', UEMOA_COUNTRIES)).toThrow(/country not supported/);
  });

  it('masks all but the country code and last two digits', () => {
    const masked = maskPhoneNumber('+221771234567');
    expect(masked.startsWith('+221 ')).toBe(true);
    expect(masked.endsWith(' 67')).toBe(true);
    expect(masked).not.toMatch(/7712345/);
    expect(maskPhoneNumber('not a number')).toBe('••••');
  });
});
