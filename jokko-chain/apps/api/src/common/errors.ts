/**
 * API error model.
 *
 * Every error response has the same shape:
 * `{ "error": { "code": "QUOTE_EXPIRED", "message": "…", "requestId": "…" } }`.
 * `code` is stable and machine-readable (the app maps it to a translated message); `message` is
 * for developers and never contains personal data, secrets or internal details.
 */

/** Stable error codes returned by the API. Never rename one; add new codes instead. */
export type ApiErrorCode =
  // Generic
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  // Auth & client
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ACCOUNT_RESTRICTED'
  | 'APP_UPDATE_REQUIRED'
  | 'ATTESTATION_FAILED'
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_KEY_REUSED'
  // Domain
  | 'FEATURE_DISABLED'
  | 'CAPABILITY_DISABLED'
  | 'QUOTE_EXPIRED'
  | 'INVALID_ADDRESS'
  | 'INVALID_AMOUNT'
  | 'INVALID_PHONE_NUMBER'
  | 'UNSUPPORTED_COUNTRY'
  | 'LIMIT_EXCEEDED'
  | 'SCREENING_BLOCKED'
  | 'PASSKEY_REQUIRED'
  | 'INVALID_STATE'
  | 'PROVIDER_ERROR'
  | 'WEBHOOK_SIGNATURE_INVALID'
  // Admin
  | 'APPROVAL_REQUIRED'
  | 'FOUR_EYES_VIOLATION';

const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ACCOUNT_RESTRICTED: 403,
  APP_UPDATE_REQUIRED: 426,
  ATTESTATION_FAILED: 403,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  IDEMPOTENCY_KEY_REUSED: 422,
  FEATURE_DISABLED: 403,
  CAPABILITY_DISABLED: 403,
  QUOTE_EXPIRED: 410,
  INVALID_ADDRESS: 400,
  INVALID_AMOUNT: 400,
  INVALID_PHONE_NUMBER: 400,
  UNSUPPORTED_COUNTRY: 400,
  LIMIT_EXCEEDED: 422,
  SCREENING_BLOCKED: 403,
  PASSKEY_REQUIRED: 403,
  INVALID_STATE: 409,
  PROVIDER_ERROR: 502,
  WEBHOOK_SIGNATURE_INVALID: 401,
  APPROVAL_REQUIRED: 202,
  FOUR_EYES_VIOLATION: 403,
};

/** An expected, user-facing failure. Anything else becomes `INTERNAL_ERROR`. */
export class ApiError extends Error {
  /** HTTP status sent to the client. */
  public readonly status: number;

  /**
   * @param code - Stable error code.
   * @param message - Developer-facing text (no personal data).
   * @param details - Optional structured details safe to return (e.g. field errors).
   */
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = DEFAULT_STATUS[code];
  }
}

/** Shorthand for a 404. */
export function notFound(what: string): ApiError {
  return new ApiError('NOT_FOUND', `${what} not found`);
}
