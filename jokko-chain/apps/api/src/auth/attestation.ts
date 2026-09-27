/**
 * App integrity attestation (docs/02-security.md, MASVS-RESILIENCE): proves a request comes
 * from our genuine, unmodified app on a real device (Apple App Attest / Google Play Integrity).
 *
 * The verifier is an adapter. Until the Apple/Google verification services are wired (needs the
 * production bundle IDs and Play Console project), {@link UnverifiedAttestationVerifier} marks
 * requests `unverified`; enforcement is switched on per environment with the
 * `attestation_enforced` app-config key, so it can be enabled without a deploy once ready.
 */

/** Verifies an attestation token for a device. */
export interface AttestationVerifier {
  /**
   * @param token - Value of the `x-jokko-attestation` header (may be absent).
   * @param platform - Device platform.
   * @param deviceId - Installation ID the token must be bound to.
   */
  verify(
    token: string | undefined,
    platform: 'ios' | 'android',
    deviceId: string,
  ): Promise<'verified' | 'unverified' | 'failed'>;
}

/** DI token for the {@link AttestationVerifier}. */
export const ATTESTATION_VERIFIER = Symbol('ATTESTATION_VERIFIER');

/** Placeholder verifier: never claims a request is verified. */
export class UnverifiedAttestationVerifier implements AttestationVerifier {
  /** Always `unverified` (never `verified`: we must not pretend to have checked). */
  verify(): Promise<'unverified'> {
    return Promise.resolve('unverified');
  }
}
