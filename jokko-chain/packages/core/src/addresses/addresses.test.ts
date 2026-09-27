import { bech32, bech32m, createBase58check } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';
import { ASSETS } from '../assets/assets.js';
import { NETWORKS } from '../networks/networks.js';
import { isLookalikeAddress, shortenAddress, toEip55, validateAddress } from './addresses.js';

const base58check = createBase58check(sha256);

describe('EVM addresses', () => {
  // Test vectors from EIP-55.
  const eip55 = [
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
    '0x52908400098527886E0F7030069857D2E4169EE7',
    '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
    '0xde709f2102306220921060314715629080e2fb77',
    '0x27b1fdb04752bbc536007a920d24acb045561c26',
  ];

  it('accepts the EIP-55 test vectors', () => {
    for (const address of eip55) {
      expect(validateAddress('evm', address, 'mainnet'), address).toEqual({
        valid: true,
        normalized: toEip55(address),
      });
    }
  });

  it('computes the checksum case', () => {
    expect(toEip55('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    );
  });

  it('rejects a wrong checksum (one letter case flipped)', () => {
    expect(validateAddress('evm', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD', 'mainnet')).toEqual(
      { valid: false, reason: 'BAD_CHECKSUM' },
    );
  });

  it('rejects malformed input', () => {
    for (const bad of [
      '0x123',
      '5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      '0xZZaeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    ]) {
      expect(validateAddress('evm', bad, 'mainnet')).toEqual({
        valid: false,
        reason: 'WRONG_FORMAT',
      });
    }
    expect(validateAddress('evm', '   ', 'mainnet')).toEqual({ valid: false, reason: 'EMPTY' });
  });
});

describe('Tron addresses', () => {
  it('accepts a valid T-address and rejects a corrupted one', () => {
    expect(validateAddress('tron', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 'mainnet').valid).toBe(
      true,
    );
    expect(validateAddress('tron', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u', 'mainnet')).toEqual({
      valid: false,
      reason: 'BAD_CHECKSUM',
    });
    expect(
      validateAddress('tron', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'mainnet').valid,
    ).toBe(false);
  });

  it('rejects a base58check payload with the wrong prefix', () => {
    const payload = new Uint8Array(21).fill(7);
    payload[0] = 0x42;
    const encoded = base58check.encode(payload);
    expect(validateAddress('tron', encoded, 'mainnet').valid).toBe(false);
  });
});

describe('Solana addresses', () => {
  it('accepts 32-byte base58 public keys', () => {
    expect(
      validateAddress('solana', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'mainnet').valid,
    ).toBe(true);
    expect(validateAddress('solana', '11111111111111111111111111111111', 'mainnet').valid).toBe(
      true,
    );
  });

  it('rejects wrong lengths and characters', () => {
    expect(validateAddress('solana', 'EPjFWdd5Aufq', 'mainnet').valid).toBe(false);
    expect(validateAddress('solana', '0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl', 'mainnet').valid).toBe(
      false,
    );
    expect(
      validateAddress('solana', '1111111111111111111111111111111111111111111', 'mainnet').valid,
    ).toBe(false);
  });
});

describe('Bitcoin addresses', () => {
  const program20 = new Uint8Array(20).fill(0xab);
  const program32 = new Uint8Array(32).fill(0xcd);
  const p2wpkh = (hrp: string): string => bech32.encode(hrp, [0, ...bech32.toWords(program20)]);
  const p2tr = (hrp: string): string => bech32m.encode(hrp, [1, ...bech32m.toWords(program32)]);

  it('accepts SegWit v0 and Taproot for the right environment', () => {
    expect(validateAddress('bitcoin', p2wpkh('bc'), 'mainnet').valid).toBe(true);
    expect(validateAddress('bitcoin', p2tr('bc'), 'mainnet').valid).toBe(true);
    expect(validateAddress('bitcoin', p2wpkh('tb'), 'testnet').valid).toBe(true);
    expect(validateAddress('bitcoin', p2wpkh('bc').toUpperCase(), 'mainnet')).toEqual({
      valid: true,
      normalized: p2wpkh('bc'),
    });
  });

  it('rejects a mainnet address in a test build and vice versa', () => {
    expect(validateAddress('bitcoin', p2wpkh('bc'), 'testnet')).toEqual({
      valid: false,
      reason: 'WRONG_ENVIRONMENT',
    });
    expect(validateAddress('bitcoin', p2wpkh('tb'), 'mainnet')).toEqual({
      valid: false,
      reason: 'WRONG_ENVIRONMENT',
    });
  });

  it('rejects Taproot encoded with the wrong checksum algorithm and mixed case', () => {
    const wrong = bech32.encode('bc', [1, ...bech32.toWords(program32)]);
    expect(validateAddress('bitcoin', wrong, 'mainnet').valid).toBe(false);
    const mixed = p2wpkh('bc').replace('q', 'Q');
    expect(validateAddress('bitcoin', mixed, 'mainnet').valid).toBe(false);
  });

  it('rejects bad witness program lengths and future versions', () => {
    const shortV0 = bech32.encode('bc', [0, ...bech32.toWords(new Uint8Array(10))]);
    expect(validateAddress('bitcoin', shortV0, 'mainnet').valid).toBe(false);
    const v2 = bech32m.encode('bc', [2, ...bech32m.toWords(program32)]);
    expect(validateAddress('bitcoin', v2, 'mainnet')).toEqual({
      valid: false,
      reason: 'UNSUPPORTED_TYPE',
    });
    const shortV1 = bech32m.encode('bc', [1, ...bech32m.toWords(program20)]);
    expect(validateAddress('bitcoin', shortV1, 'mainnet').valid).toBe(false);
  });

  it('accepts legacy base58 addresses per environment', () => {
    // The genesis block coinbase address.
    expect(validateAddress('bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'mainnet').valid).toBe(
      true,
    );
    expect(validateAddress('bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'testnet')).toEqual({
      valid: false,
      reason: 'WRONG_ENVIRONMENT',
    });
    const testnetPayload = new Uint8Array(21).fill(1);
    testnetPayload[0] = 0x6f;
    expect(validateAddress('bitcoin', base58check.encode(testnetPayload), 'testnet').valid).toBe(
      true,
    );
    const unknownVersion = new Uint8Array(21).fill(1);
    unknownVersion[0] = 0x30;
    expect(validateAddress('bitcoin', base58check.encode(unknownVersion), 'mainnet').valid).toBe(
      false,
    );
    expect(validateAddress('bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb', 'mainnet')).toEqual({
      valid: false,
      reason: 'BAD_CHECKSUM',
    });
  });
});

describe('asset registry consistency', () => {
  it('every token contract is a valid address for its network, stored in canonical form', () => {
    for (const asset of ASSETS) {
      for (const environment of ['mainnet', 'testnet'] as const) {
        const contract = asset.contract[environment];
        if (contract === null) continue;
        const family = NETWORKS[asset.network].family;
        const result = validateAddress(family, contract, environment);
        expect(result, `${asset.id} ${environment}`).toEqual({ valid: true, normalized: contract });
      }
    }
  });
});

describe('anti-poisoning helpers', () => {
  it('flags look-alike addresses but not the same one', () => {
    const real = '0x7a3F91c2d4e8b0f3a6d19e5c7b2a48f04b9c21aa';
    const fake = '0x7a3F00000000000000000000000000000000c21aa';
    expect(isLookalikeAddress(fake, real)).toBe(true);
    expect(isLookalikeAddress(real, real)).toBe(false);
    expect(isLookalikeAddress('0x1111000000000000000000000000000000002222', real)).toBe(false);
  });

  it('shortens long addresses and keeps short ones', () => {
    expect(shortenAddress('0x7a3F91c2d4e8b0f3a6d19e5c7b2a48f04b9c21')).toBe('0x7a3F91…4b9c21');
    expect(shortenAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBe('TR7NHq…gjLj6t');
    expect(shortenAddress('short')).toBe('short');
  });
});
