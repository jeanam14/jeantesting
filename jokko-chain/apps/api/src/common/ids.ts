/**
 * UUID version 7 generator (RFC 9562).
 *
 * WHY v7: identifiers are time-ordered, so new rows land at the end of B-tree indexes (better
 * insert performance and locality than random v4), while still being unguessable enough to
 * expose in URLs (74 random bits). We never expose sequential integer IDs (docs/04 conventions).
 */
import { randomBytes } from 'node:crypto';

/** Returns a new UUIDv7 string, e.g. `0192f0c1-7a3e-7c4d-8b2a-9f1e2d3c4b5a`. */
export function uuidv7(now: number = Date.now()): string {
  const bytes = randomBytes(16);
  const timestamp = BigInt(now);
  // 48-bit big-endian Unix timestamp in milliseconds.
  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);
  // Version 7 in the high nibble of byte 6, RFC 4122 variant in byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
