/**
 * Shared outbound-HTTP helper for provider adapters.
 *
 * Every call to a third party goes through {@link providerFetch} so that all adapters get the
 * same protections: a hard timeout (a slow provider must never hang a user request), HTTPS only,
 * a response-size cap, and errors that never include credentials or response bodies (which may
 * contain personal data) in their message.
 */
import { ApiError } from '../common/errors.js';

/** Options for {@link providerFetch}. */
export interface ProviderFetchOptions {
  readonly provider: string;
  readonly method: 'GET' | 'POST';
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  /** Default 8 s. */
  readonly timeoutMs?: number;
  /** Status codes that are returned to the caller instead of thrown (e.g. 404 = not found). */
  readonly passthroughStatuses?: readonly number[];
}

/** Result of {@link providerFetch}. `text` is the raw body (parse it with a schema). */
export interface ProviderResponse {
  readonly status: number;
  readonly text: string;
}

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Performs one provider call with the protections above. Throws `PROVIDER_ERROR` on failure. */
export async function providerFetch(options: ProviderFetchOptions): Promise<ProviderResponse> {
  const url = new URL(options.url);
  if (url.protocol !== 'https:') {
    throw new ApiError('PROVIDER_ERROR', `${options.provider}: only https endpoints are allowed`);
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers: {
        accept: 'application/json',
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 8_000),
      redirect: 'error',
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network error';
    throw new ApiError('PROVIDER_ERROR', `${options.provider}: ${reason}`);
  }
  const text = await response.text();
  if (text.length > MAX_RESPONSE_BYTES) {
    throw new ApiError('PROVIDER_ERROR', `${options.provider}: response too large`);
  }
  if (!response.ok && !(options.passthroughStatuses ?? []).includes(response.status)) {
    throw new ApiError('PROVIDER_ERROR', `${options.provider}: HTTP ${response.status}`);
  }
  return { status: response.status, text };
}

/** Parses JSON without throwing a raw SyntaxError that could echo provider content. */
export function parseProviderJson(provider: string, text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError('PROVIDER_ERROR', `${provider}: invalid JSON response`);
  }
}
