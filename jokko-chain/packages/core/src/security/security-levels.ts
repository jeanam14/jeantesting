/**
 * Security levels and balance thresholds (D13, docs/03-onboarding-and-recovery.md §4).
 *
 * Level 1 — Basic: phone login + app lock.
 * Level 2 — Protected: + verified email + passkey (Privy wallet MFA).
 * Level 3 — Maximum: + cloud backup (iCloud / Google Drive).
 *
 * Thresholds are server configuration (so they can be tuned without an app release); the
 * defaults below are the values the founder accepted. There is deliberately **no** waiting
 * period after a new-device login (rejected in D13).
 */

/** Security level shown to the user. */
export type SecurityLevel = 1 | 2 | 3;

/** Balance thresholds in XOF (whole francs). */
export interface SecurityThresholds {
  /** From this balance, prompt (dismissibly) to add email + passkey. */
  readonly promptLevel2AtXof: bigint;
  /** From this balance, a passkey is required to SEND (receiving is never blocked). */
  readonly requirePasskeyToSendAtXof: bigint;
  /** From this balance, strongly recommend cloud backup. */
  readonly recommendBackupAtXof: bigint;
  /** Any single send at or above this amount gets an extra confirmation screen. */
  readonly largeSendConfirmAtXof: bigint;
}

/** Thresholds accepted in D13. */
export const DEFAULT_SECURITY_THRESHOLDS: SecurityThresholds = {
  promptLevel2AtXof: 50_000n,
  requirePasskeyToSendAtXof: 250_000n,
  recommendBackupAtXof: 1_000_000n,
  largeSendConfirmAtXof: 500_000n,
};

/** What the user has set up. */
export interface SecuritySetup {
  readonly emailVerified: boolean;
  readonly passkeyEnrolled: boolean;
  readonly cloudBackupEnabled: boolean;
}

/** Prompts the app may show. */
export type SecurityPrompt = 'add_email' | 'add_passkey' | 'enable_backup';

/** Result of {@link evaluateSecurity}. */
export interface SecurityEvaluation {
  readonly level: SecurityLevel;
  /** Prompts to show on the home "Sécurisez votre compte" card, most important first. */
  readonly prompts: readonly SecurityPrompt[];
  /** When true, the send flow must require a passkey before continuing. */
  readonly passkeyRequiredToSend: boolean;
}

/** Computes the current level from what is set up. */
export function securityLevel(setup: SecuritySetup): SecurityLevel {
  if (setup.emailVerified && setup.passkeyEnrolled && setup.cloudBackupEnabled) return 3;
  if (setup.emailVerified && setup.passkeyEnrolled) return 2;
  return 1;
}

/**
 * Evaluates what the app must show or enforce for a user with `balanceXof` (total balance,
 * whole francs) and the given setup.
 */
export function evaluateSecurity(
  balanceXof: bigint,
  setup: SecuritySetup,
  thresholds: SecurityThresholds = DEFAULT_SECURITY_THRESHOLDS,
): SecurityEvaluation {
  const prompts: SecurityPrompt[] = [];
  if (balanceXof >= thresholds.promptLevel2AtXof) {
    if (!setup.passkeyEnrolled) prompts.push('add_passkey');
    if (!setup.emailVerified) prompts.push('add_email');
  }
  if (balanceXof >= thresholds.recommendBackupAtXof && !setup.cloudBackupEnabled) {
    prompts.push('enable_backup');
  }
  return {
    level: securityLevel(setup),
    prompts,
    passkeyRequiredToSend:
      balanceXof >= thresholds.requirePasskeyToSendAtXof && !setup.passkeyEnrolled,
  };
}

/** Whether a single send needs the extra confirmation screen. */
export function needsLargeSendConfirmation(
  amountXof: bigint,
  thresholds: SecurityThresholds = DEFAULT_SECURITY_THRESHOLDS,
): boolean {
  return amountXof >= thresholds.largeSendConfirmAtXof;
}
