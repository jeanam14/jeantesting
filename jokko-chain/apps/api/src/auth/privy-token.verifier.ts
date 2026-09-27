/**
 * Verifies Privy access tokens presented by the mobile app.
 *
 * After login, the Privy SDK on the phone holds a short-lived access token: a JWT signed by
 * Privy with ES256. The app sends it as `Authorization: Bearer <token>`. We verify it locally
 * with Privy's public verification key (from the Privy dashboard, configured as
 * `PRIVY_VERIFICATION_KEY`), so no network call is needed per request.
 *
 * Checks (all mandatory): signature with ES256 only (no algorithm confusion), issuer
 * `privy.io`, audience = our Privy app ID, not expired, subject is a Privy DID.
 *
 * This proves WHO the user is. It gives the backend no power over the user's wallet: signing
 * keys never leave Privy's infrastructure and the user's device (CLAUDE.md rules 1-2).
 */
import { Inject, Injectable } from '@nestjs/common';
import { errors as joseErrors, importSPKI, jwtVerify, type CryptoKey } from 'jose';
import type { AppConfig } from '../config/env.js';
import { ApiError } from '../common/errors.js';
import { APP_CONFIG } from '../common/tokens.js';

/** Issuer of every Privy access token. */
export const PRIVY_ISSUER = 'privy.io';

/** Allowed clock skew between our servers and Privy's (seconds). */
const CLOCK_TOLERANCE_SECONDS = 5;

/** Identity extracted from a valid token. */
export interface VerifiedPrivySession {
  /** Privy user ID, e.g. `did:privy:cm3np4u9j001rc8b73seqmqqk`. */
  readonly privyUserId: string;
  /** Privy session ID (`sid`), used to correlate logins. */
  readonly sessionId: string | null;
  readonly expiresAt: Date;
}

/** Stateless verifier for Privy access tokens. */
@Injectable()
export class PrivyTokenVerifier {
  private keyPromise: Promise<CryptoKey> | null = null;

  /** @param config - Validated configuration (verification key and app ID). */
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  /**
   * Verifies `token` and returns the session, or throws `UNAUTHENTICATED`. The reason for a
   * failure is deliberately not returned to the client (it only helps attackers).
   */
  async verify(token: string): Promise<VerifiedPrivySession> {
    try {
      const { payload } = await jwtVerify(token, await this.key(), {
        issuer: PRIVY_ISSUER,
        audience: this.config.PRIVY_APP_ID,
        algorithms: ['ES256'],
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
        requiredClaims: ['sub', 'exp', 'iat'],
      });
      const subject = payload.sub ?? '';
      if (!subject.startsWith('did:privy:') || subject.length > 128) {
        throw new ApiError('UNAUTHENTICATED', 'invalid access token');
      }
      const sid = typeof payload['sid'] === 'string' ? payload['sid'] : null;
      return {
        privyUserId: subject,
        sessionId: sid,
        expiresAt: new Date((payload.exp ?? 0) * 1000),
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof joseErrors.JOSEError) {
        throw new ApiError('UNAUTHENTICATED', 'invalid or expired access token');
      }
      throw error;
    }
  }

  /** Imports the PEM key once (lazily) and caches the promise. */
  private key(): Promise<CryptoKey> {
    this.keyPromise ??= importSPKI(
      this.config.PRIVY_VERIFICATION_KEY.replace(/\\n/g, '\n'),
      'ES256',
    );
    return this.keyPromise;
  }
}
