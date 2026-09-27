/**
 * Address validation for every network family, plus anti-poisoning helpers.
 *
 * Validation runs before any send (pipeline step "validate", docs/01-architecture.md §9) and
 * blocks the most common irreversible mistakes: a typo, a Bitcoin address pasted into a
 * Polygon send, or a mainnet address in a test build.
 *
 * Cryptography comes from the audited `@noble/hashes` and `@scure/base` libraries; nothing
 * here is hand-rolled.
 */
import { bech32, bech32m, base58, createBase58check } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { ChainEnvironment, NetworkFamily } from '../networks/networks.js';

/** Result of {@link validateAddress}. */
export type AddressValidation =
  | {
      readonly valid: true;
      /** Canonical form to store and display (EIP-55 checksum case for EVM). */
      readonly normalized: string;
    }
  | {
      readonly valid: false;
      /** Machine-readable reason, mapped to a translated message by the app. */
      readonly reason: AddressInvalidReason;
    };

/** Why an address was rejected. */
export type AddressInvalidReason =
  | 'EMPTY'
  | 'WRONG_FORMAT'
  | 'BAD_CHECKSUM'
  | 'WRONG_ENVIRONMENT'
  | 'UNSUPPORTED_TYPE';

const base58check = createBase58check(sha256);

/**
 * Validates an address for a network family in an environment.
 *
 * - EVM: `0x` + 40 hex. Mixed-case input must match its EIP-55 checksum; all-lower or
 *   all-upper input is accepted and returned in checksum case.
 * - Tron: base58check, 21 bytes, prefix `0x41` (`T…`). Same format on mainnet and Nile.
 * - Solana: base58, exactly 32 bytes.
 * - Bitcoin: SegWit v0 (bech32) and Taproot v1 (bech32m) with `bc` (mainnet) or `tb`
 *   (testnet) prefix. Legacy base58 addresses are accepted as destinations too.
 */
export function validateAddress(
  family: NetworkFamily,
  address: string,
  environment: ChainEnvironment,
): AddressValidation {
  const input = address.trim();
  if (input.length === 0) return { valid: false, reason: 'EMPTY' };
  switch (family) {
    case 'evm':
      return validateEvm(input);
    case 'tron':
      return validateTron(input);
    case 'solana':
      return validateSolana(input);
    case 'bitcoin':
      return validateBitcoin(input, environment);
  }
}

/** Returns the EIP-55 checksummed form of a 40-hex-digit EVM address (without validation). */
export function toEip55(address: string): string {
  const lower = address.toLowerCase().replace(/^0x/, '');
  const hash = bytesToHex(keccak_256(utf8ToBytes(lower)));
  let out = '0x';
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i] ?? '';
    const nibble = parseInt(hash[i] ?? '0', 16);
    out += nibble >= 8 ? char.toUpperCase() : char;
  }
  return out;
}

function validateEvm(input: string): AddressValidation {
  if (!/^0x[0-9a-fA-F]{40}$/.test(input)) return { valid: false, reason: 'WRONG_FORMAT' };
  const body = input.slice(2);
  const checksummed = toEip55(input);
  const isSingleCase = body === body.toLowerCase() || body === body.toUpperCase();
  if (!isSingleCase && checksummed !== input) return { valid: false, reason: 'BAD_CHECKSUM' };
  return { valid: true, normalized: checksummed };
}

function validateTron(input: string): AddressValidation {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(input)) return { valid: false, reason: 'WRONG_FORMAT' };
  try {
    const bytes = base58check.decode(input);
    if (bytes.length !== 21 || bytes[0] !== 0x41) return { valid: false, reason: 'WRONG_FORMAT' };
    return { valid: true, normalized: input };
  } catch {
    return { valid: false, reason: 'BAD_CHECKSUM' };
  }
}

function validateSolana(input: string): AddressValidation {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) return { valid: false, reason: 'WRONG_FORMAT' };
  try {
    const bytes = base58.decode(input);
    if (bytes.length !== 32) return { valid: false, reason: 'WRONG_FORMAT' };
    return { valid: true, normalized: input };
  } catch {
    return { valid: false, reason: 'WRONG_FORMAT' };
  }
}

function validateBitcoin(input: string, environment: ChainEnvironment): AddressValidation {
  const lower = input.toLowerCase();
  const expectedHrp = environment === 'mainnet' ? 'bc' : 'tb';
  if (/^(bc|tb)1/.test(lower)) {
    if (input !== lower && input !== input.toUpperCase()) {
      return { valid: false, reason: 'WRONG_FORMAT' };
    }
    const hrp = lower.slice(0, 2);
    if (hrp !== expectedHrp) return { valid: false, reason: 'WRONG_ENVIRONMENT' };
    return validateSegwit(lower, hrp);
  }
  return validateLegacyBitcoin(input, environment);
}

function validateSegwit(address: string, hrp: string): AddressValidation {
  // Witness version 0 uses bech32 (BIP-173); versions 1+ use bech32m (BIP-350).
  const version = address.charAt(3);
  const decoder = version === 'q' ? bech32 : bech32m;
  try {
    const decoded = decoder.decode(address as `${string}1${string}`, 90);
    if (decoded.prefix !== hrp) return { valid: false, reason: 'WRONG_FORMAT' };
    const [witnessVersion, ...rest] = decoded.words;
    if (witnessVersion === undefined || witnessVersion > 16) {
      return { valid: false, reason: 'WRONG_FORMAT' };
    }
    const program = decoder.fromWords(rest);
    if (witnessVersion === 0 && program.length !== 20 && program.length !== 32) {
      return { valid: false, reason: 'WRONG_FORMAT' };
    }
    if (witnessVersion === 1 && program.length !== 32) {
      return { valid: false, reason: 'WRONG_FORMAT' };
    }
    if (witnessVersion > 1) return { valid: false, reason: 'UNSUPPORTED_TYPE' };
    return { valid: true, normalized: address };
  } catch {
    return { valid: false, reason: 'BAD_CHECKSUM' };
  }
}

function validateLegacyBitcoin(input: string, environment: ChainEnvironment): AddressValidation {
  if (!/^[1-9A-HJ-NP-Za-km-z]{26,35}$/.test(input)) return { valid: false, reason: 'WRONG_FORMAT' };
  let bytes: Uint8Array;
  try {
    bytes = base58check.decode(input);
  } catch {
    return { valid: false, reason: 'BAD_CHECKSUM' };
  }
  if (bytes.length !== 21) return { valid: false, reason: 'WRONG_FORMAT' };
  const version = bytes[0];
  const mainnetVersions = [0x00, 0x05];
  const testnetVersions = [0x6f, 0xc4];
  const allowed = environment === 'mainnet' ? mainnetVersions : testnetVersions;
  const other = environment === 'mainnet' ? testnetVersions : mainnetVersions;
  if (version !== undefined && allowed.includes(version)) return { valid: true, normalized: input };
  if (version !== undefined && other.includes(version)) {
    return { valid: false, reason: 'WRONG_ENVIRONMENT' };
  }
  return { valid: false, reason: 'WRONG_FORMAT' };
}

/**
 * Anti address-poisoning check (T8): returns `true` when `candidate` looks like `known`
 * (same first and last `edge` characters) but is a different address. Attackers generate such
 * look-alikes and send dust from them, hoping the user copies the wrong one from history.
 */
export function isLookalikeAddress(candidate: string, known: string, edge = 4): boolean {
  const a = candidate.toLowerCase();
  const b = known.toLowerCase();
  if (a === b) return false;
  const strip = (s: string): string => s.replace(/^0x/, '');
  const sa = strip(a);
  const sb = strip(b);
  return sa.slice(0, edge) === sb.slice(0, edge) && sa.slice(-edge) === sb.slice(-edge);
}

/**
 * Shortens an address for display while keeping enough characters to compare
 * (`0x7a3F91…4b9c21`). The confirmation screen always shows the full address as well.
 */
export function shortenAddress(address: string, edge = 6): string {
  const prefix = address.startsWith('0x') ? 2 : 0;
  if (address.length <= prefix + edge * 2 + 1) return address;
  return `${address.slice(0, prefix + edge)}…${address.slice(-edge)}`;
}
