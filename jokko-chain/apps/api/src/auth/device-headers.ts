/**
 * Parsing of the device headers every authenticated app request carries:
 *
 * - `x-jokko-device-id`: random installation ID (16-64 URL-safe characters)
 * - `x-jokko-platform`: `ios` | `android`
 * - `x-jokko-app-version`: `major.minor.patch`
 * - `x-jokko-attestation`: App Attest / Play Integrity token (optional until enforced)
 */
import type { FastifyRequest } from 'fastify';
import { ApiError } from '../common/errors.js';
import { parseSemver } from '../common/semver.js';

const DEVICE_ID = /^[A-Za-z0-9_-]{16,64}$/;

/** Raw device headers after validation. */
export interface DeviceHeaders {
  readonly deviceId: string;
  readonly platform: 'ios' | 'android';
  readonly appVersion: string;
  readonly attestationToken: string | undefined;
}

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return typeof value === 'string' ? value : undefined;
}

/** Reads and validates the device headers; throws `VALIDATION_FAILED` when malformed. */
export function readDeviceHeaders(request: FastifyRequest): DeviceHeaders {
  const deviceId = header(request, 'x-jokko-device-id');
  const platform = header(request, 'x-jokko-platform');
  const appVersion = header(request, 'x-jokko-app-version');
  const attestationToken = header(request, 'x-jokko-attestation');
  if (!deviceId || !DEVICE_ID.test(deviceId)) {
    throw new ApiError('VALIDATION_FAILED', 'x-jokko-device-id header is missing or invalid');
  }
  if (platform !== 'ios' && platform !== 'android') {
    throw new ApiError('VALIDATION_FAILED', 'x-jokko-platform must be ios or android');
  }
  if (!appVersion || !parseSemver(appVersion)) {
    throw new ApiError('VALIDATION_FAILED', 'x-jokko-app-version must look like 1.2.3');
  }
  if (attestationToken !== undefined && attestationToken.length > 8192) {
    throw new ApiError('VALIDATION_FAILED', 'x-jokko-attestation is too long');
  }
  return { deviceId, platform, appVersion, attestationToken };
}

/** Extracts the bearer token from `Authorization`, or `undefined`. */
export function readBearerToken(request: FastifyRequest): string | undefined {
  const value = header(request, 'authorization');
  if (!value) return undefined;
  const match = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(value);
  return match?.[1];
}
