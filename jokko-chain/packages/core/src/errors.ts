/**
 * Error type shared by every function in `@jokko/core`.
 *
 * Every failure carries a stable, machine-readable `code` so callers (API, mobile app) can map
 * it to a translated user message without parsing English text. Codes are part of the public
 * contract: never rename one, add a new one instead.
 */
export class JokkoCoreError extends Error {
  /**
   * @param code - Stable identifier, e.g. `INVALID_AMOUNT`.
   * @param message - Developer-facing explanation (never shown to users as-is).
   */
  constructor(
    public readonly code: JokkoCoreErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'JokkoCoreError';
  }
}

/** Every error code `@jokko/core` can raise. */
export type JokkoCoreErrorCode =
  | 'INVALID_AMOUNT'
  | 'TOO_MANY_DECIMALS'
  | 'NEGATIVE_AMOUNT'
  | 'INVALID_DECIMALS'
  | 'INVALID_RATE'
  | 'DIVISION_BY_ZERO'
  | 'UNKNOWN_NETWORK'
  | 'UNKNOWN_ASSET'
  | 'INVALID_PHONE_NUMBER'
  | 'UNSUPPORTED_COUNTRY'
  | 'INVALID_FEE_SCHEDULE';
