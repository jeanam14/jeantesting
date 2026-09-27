/**
 * Reusable zod building blocks for request validation. Amounts always travel as decimal
 * STRINGS (never JSON numbers, which are floats), and are converted with `@jokko/core`.
 */
import { isNetworkKey, NETWORK_KEYS, type NetworkKey } from '@jokko/core';
import { z } from 'zod';

/** A non-negative canonical decimal string, e.g. `"12.5"`. */
export const decimalString = z
  .string()
  .max(80)
  .regex(/^\d+(\.\d+)?$/, 'must be a decimal string like "12.5"');

/** Integer base units as a string (e.g. `"1500000"`). */
export const baseUnitsString = z.string().max(80).regex(/^\d+$/, 'must be an integer string');

/** One of the supported networks. */
export const networkKeySchema = z.string().refine((v): v is NetworkKey => isNetworkKey(v), {
  message: `must be one of ${NETWORK_KEYS.join(', ')}`,
});

/** Asset identifier like `usdc:polygon`. */
export const assetIdSchema = z
  .string()
  .regex(/^[a-z0-9]+:[a-z]+$/, 'must look like "usdc:polygon"');

/** UUID route parameter. */
export const uuidSchema = z.uuid();

/** Cursor pagination query (`?limit=20&before=<iso date>`). */
export const paginationSchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.iso.datetime().optional(),
});

/** Supported UI languages. */
export const localeSchema = z.enum(['fr', 'en']);

/** Serialises values for JSON responses: bigint → decimal string (JSON has no bigint). */
export function toJsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}
