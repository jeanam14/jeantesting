/**
 * Field-level encryption for personal data (docs/02-security.md T14, docs/04 conventions).
 *
 * - Encryption: AES-256-GCM (authenticated), random 96-bit IV per value, key version byte so
 *   keys can be rotated without re-encrypting everything at once.
 *   Layout: [version:1][iv:12][tag:16][ciphertext:n].
 * - Lookup: a keyed HMAC-SHA256 "blind index" of the normalised value (e.g. E.164 phone), so
 *   the API can find a user by phone without being able to read phones back from the index.
 *
 * Keys come from the configuration (injected from the secret manager). In production the
 * keyring holds data keys generated and wrapped by AWS KMS (envelope encryption).
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** Encrypts and decrypts personal fields and computes blind indexes. */
export class FieldEncryption {
  /**
   * @param keys - Keyring: version → 32-byte key.
   * @param activeVersion - Version used for new encryptions.
   * @param hmacKey - 32-byte key for blind indexes.
   */
  constructor(
    private readonly keys: ReadonlyMap<number, Buffer>,
    private readonly activeVersion: number,
    private readonly hmacKey: Buffer,
  ) {
    const active = keys.get(activeVersion);
    if (!active || active.length !== 32)
      throw new Error('active encryption key missing or invalid');
    if (hmacKey.length !== 32) throw new Error('HMAC key must be 32 bytes');
  }

  /** Encrypts a UTF-8 string. Each call yields a different ciphertext (random IV). */
  encrypt(plaintext: string): Buffer {
    const key = this.keys.get(this.activeVersion) as Buffer;
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return Buffer.concat([Buffer.from([this.activeVersion]), iv, cipher.getAuthTag(), ciphertext]);
  }

  /** Decrypts a value produced by {@link encrypt}. Throws if it was tampered with. */
  decrypt(payload: Buffer): string {
    if (payload.length < 1 + IV_LENGTH + TAG_LENGTH) throw new Error('ciphertext too short');
    const version = payload[0] as number;
    const key = this.keys.get(version);
    if (!key) throw new Error(`unknown encryption key version ${version}`);
    const iv = payload.subarray(1, 1 + IV_LENGTH);
    const tag = payload.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
    const ciphertext = payload.subarray(1 + IV_LENGTH + TAG_LENGTH);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  /** Encrypts when a value is present, passes `null`/`undefined` through as `null`. */
  encryptOptional(plaintext: string | null | undefined): Buffer | null {
    return plaintext === null || plaintext === undefined ? null : this.encrypt(plaintext);
  }

  /** Decrypts when a value is present. */
  decryptOptional(payload: Buffer | null | undefined): string | null {
    return payload === null || payload === undefined ? null : this.decrypt(payload);
  }

  /**
   * Blind index for exact-match lookups. Callers MUST normalise first (E.164 phone, lower-case
   * trimmed email) so equal values always produce equal indexes. `purpose` domain-separates
   * indexes so a phone hash can never collide with an email hash.
   */
  blindIndex(purpose: 'phone' | 'email', normalizedValue: string): string {
    return createHmac('sha256', this.hmacKey).update(`${purpose}:${normalizedValue}`).digest('hex');
  }

  /** Whether a ciphertext was produced with an old key (for background re-encryption). */
  needsRotation(payload: Buffer): boolean {
    return payload[0] !== this.activeVersion;
  }
}

/** Normalises an email for blind indexing (trim + lower-case). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
