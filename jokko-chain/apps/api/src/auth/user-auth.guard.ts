/**
 * Global guard of the public (mobile) API. Runs before every controller method.
 *
 * Order of checks (cheapest and least revealing first):
 * 1. `@Public()` routes skip everything below.
 * 2. Device headers are well-formed; the app version is not below the minimum (426 forces an
 *    update, e.g. after a security fix); attestation is valid when enforced.
 * 3. The Privy access token is valid (signature, issuer, audience, expiry).
 * 4. The Jokko user exists (unless `@AllowUnregistered()`), is not closed, and this device has
 *    not been revoked by the user ("sign out this phone").
 * 5. `@RequiresActiveAccount()`: restricted users cannot move money.
 * 6. `@RequiresFeature(flag)`: the feature's kill switch is on.
 */
import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import type { FastifyRequest } from 'fastify';
import { AppConfigService } from '../common/app-config.service.js';
import { ApiError } from '../common/errors.js';
import { compareSemver, parseSemver } from '../common/semver.js';
import { DATABASE } from '../common/tokens.js';
import type { Database } from '../database/db.js';
import { userDevices, users } from '../database/schema/index.js';
import { ATTESTATION_VERIFIER, type AttestationVerifier } from './attestation.js';
import {
  ALLOW_UNREGISTERED,
  IS_PUBLIC,
  REQUIRED_FEATURE,
  REQUIRES_ACTIVE_ACCOUNT,
} from './decorators.js';
import { readBearerToken, readDeviceHeaders } from './device-headers.js';
import { PrivyTokenVerifier } from './privy-token.verifier.js';
import type { AuthenticatedUser } from './request-context.js';

/** Minimum app versions per platform (app-config key `min_app_version`). */
interface MinAppVersion {
  readonly ios: string;
  readonly android: string;
}

/** See file header. */
@Injectable()
export class UserAuthGuard implements CanActivate {
  /**
   * @param reflector - Reads route metadata.
   * @param verifier - Privy token verifier.
   * @param appConfig - Flags and runtime config.
   * @param attestation - App integrity verifier.
   * @param db - Database handle.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: PrivyTokenVerifier,
    private readonly appConfig: AppConfigService,
    @Inject(ATTESTATION_VERIFIER) private readonly attestation: AttestationVerifier,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  /** Nest guard entry point. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const device = readDeviceHeaders(request);
    await this.assertAppVersion(device.platform, device.appVersion);

    const attestation = await this.attestation.verify(
      device.attestationToken,
      device.platform,
      device.deviceId,
    );
    if (attestation === 'failed')
      throw new ApiError('ATTESTATION_FAILED', 'app integrity check failed');
    if (attestation !== 'verified' && (await this.appConfig.get('attestation_enforced', false))) {
      throw new ApiError('ATTESTATION_FAILED', 'app integrity check required');
    }

    const token = readBearerToken(request);
    if (!token) throw new ApiError('UNAUTHENTICATED', 'authentication required');
    const session = await this.verifier.verify(token);

    const user = await this.loadUser(session.privyUserId, device.deviceId);
    if (!user && !this.reflector.getAllAndOverride<boolean>(ALLOW_UNREGISTERED, targets)) {
      throw new ApiError('UNAUTHENTICATED', 'session not registered');
    }
    if (
      user?.status === 'restricted' &&
      this.reflector.getAllAndOverride<boolean>(REQUIRES_ACTIVE_ACCOUNT, targets)
    ) {
      throw new ApiError('ACCOUNT_RESTRICTED', 'this action is not available on your account');
    }

    const flag = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_FEATURE, targets);
    if (flag && !(await this.appConfig.isEnabled(flag))) {
      throw new ApiError('FEATURE_DISABLED', 'this feature is not available yet');
    }

    request.jokko = {
      session,
      user,
      device: {
        deviceId: device.deviceId,
        platform: device.platform,
        appVersion: device.appVersion,
        attestation,
      },
    };
    return true;
  }

  private async assertAppVersion(platform: 'ios' | 'android', version: string): Promise<void> {
    const minimum = await this.appConfig.get<MinAppVersion>('min_app_version', {
      ios: '0.0.0',
      android: '0.0.0',
    });
    const required = minimum[platform];
    // A malformed configured minimum must not lock everyone out; it is reported by the admin
    // config validation instead.
    if (!parseSemver(required)) return;
    if (compareSemver(version, required) < 0) {
      throw new ApiError('APP_UPDATE_REQUIRED', 'please update the app', {
        minimumVersion: required,
      });
    }
  }

  /**
   * Loads the user and, in the same query, whether this device was revoked.
   * Returns `null` when no Jokko user is linked to the Privy account yet.
   */
  private async loadUser(privyUserId: string, deviceId: string): Promise<AuthenticatedUser | null> {
    const rows = await this.db
      .select({
        id: users.id,
        status: users.status,
        locale: users.locale,
        country: users.country,
        deviceRevokedAt: userDevices.revokedAt,
      })
      .from(users)
      .leftJoin(
        userDevices,
        and(eq(userDevices.userId, users.id), eq(userDevices.deviceId, deviceId)),
      )
      .where(eq(users.privyUserId, privyUserId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.status === 'closed') throw new ApiError('ACCOUNT_RESTRICTED', 'this account is closed');
    if (row.deviceRevokedAt) throw new ApiError('UNAUTHENTICATED', 'this device was signed out');
    return {
      id: row.id,
      privyUserId,
      status: row.status,
      locale: row.locale === 'en' ? 'en' : 'fr',
      country: row.country,
    };
  }
}
