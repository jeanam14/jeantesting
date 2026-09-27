/**
 * Environment configuration, validated once at start-up (fail fast).
 *
 * Secrets arrive as environment variables injected from the secret manager (AWS Secrets
 * Manager in deployed environments, a local `.env` that is never committed on developer
 * machines). The process refuses to start when a value is missing, malformed, or unsafe for the
 * environment — e.g. demo mode or dev admin login in production (D23, docs/02-security.md).
 */
import { z } from 'zod';

const base64Key = z
  .string()
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, 'must be base64')
  .refine((v) => Buffer.from(v, 'base64').length === 32, 'must decode to 32 bytes');

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

/** Raw schema of the environment variables. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Deployment environment. Only `prod` talks to mainnets and real money. */
  APP_ENV: z.enum(['local', 'dev', 'staging', 'prod']),
  CHAIN_ENVIRONMENT: z.enum(['testnet', 'mainnet']),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),

  PORT_API: z.coerce.number().int().min(1).max(65535).default(3000),
  PORT_ADMIN: z.coerce.number().int().min(1).max(65535).default(3001),

  /** Privy app ID (public). Used as the JWT audience. */
  PRIVY_APP_ID: z.string().min(1),
  /** Privy ES256 verification key (PEM, public) for access tokens. */
  PRIVY_VERIFICATION_KEY: z.string().includes('BEGIN PUBLIC KEY'),
  /** Privy app secret: server-only, needed for pregenerated wallets and user lookups. */
  PRIVY_APP_SECRET: z.string().min(1).optional(),

  /**
   * Keyring for personal-data encryption: `v1:<base64 32 bytes>,v2:<...>`. The LAST key
   * encrypts; all keys decrypt (rotation without downtime).
   */
  PII_ENCRYPTION_KEYS: z.string().min(1),
  /** HMAC key (base64, 32 bytes) for blind indexes (phone/email lookups). */
  PII_HMAC_KEY: base64Key,

  /** Staff SSO (OIDC). Required unless ADMIN_DEV_AUTH is on (never in production). */
  ADMIN_OIDC_ISSUER: z.url().optional(),
  ADMIN_OIDC_AUDIENCE: z.string().min(1).optional(),
  ADMIN_OIDC_JWKS_URL: z.url().optional(),
  /** Local development only: accept `x-dev-admin` headers instead of SSO. */
  ADMIN_DEV_AUTH: booleanString,
  /** Origin of the admin web UI (CORS for the admin listener only). */
  ADMIN_UI_ORIGIN: z.url().optional(),

  /** Show sample data for features not yet connected (D23). Never in production. */
  DEMO_MODE: booleanString,
});

/** Validated, typed configuration. */
export type AppConfig = z.infer<typeof envSchema> & {
  /** Parsed keyring: version → 32-byte key. */
  readonly piiKeys: ReadonlyMap<number, Buffer>;
  readonly piiActiveKeyVersion: number;
};

/** Error thrown when the environment is invalid; lists every problem at once. */
export class ConfigError extends Error {
  /** @param problems - One human-readable line per problem. */
  constructor(public readonly problems: readonly string[]) {
    super(`Invalid configuration:\n - ${problems.join('\n - ')}`);
    this.name = 'ConfigError';
  }
}

/** Parses `v1:<b64>,v2:<b64>` into a keyring. */
export function parseKeyring(value: string): { keys: Map<number, Buffer>; active: number } {
  const keys = new Map<number, Buffer>();
  let active = -1;
  for (const entry of value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const match = /^v(\d+):(.+)$/.exec(entry);
    if (!match) throw new ConfigError(['PII_ENCRYPTION_KEYS: entries must look like v1:<base64>']);
    const version = Number(match[1]);
    const key = Buffer.from(match[2] ?? '', 'base64');
    if (key.length !== 32) {
      throw new ConfigError([`PII_ENCRYPTION_KEYS: key v${version} must decode to 32 bytes`]);
    }
    if (version < 1 || version > 255) {
      throw new ConfigError(['PII_ENCRYPTION_KEYS: versions must be 1..255']);
    }
    if (keys.has(version)) throw new ConfigError([`PII_ENCRYPTION_KEYS: duplicate v${version}`]);
    keys.set(version, key);
    active = version;
  }
  if (keys.size === 0) throw new ConfigError(['PII_ENCRYPTION_KEYS: at least one key is required']);
  return { keys, active };
}

/**
 * Validates `env` (usually `process.env`) and returns the typed configuration, or throws a
 * {@link ConfigError} listing every problem.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }
  const config = parsed.data;
  const problems: string[] = [];

  // Environment consistency: mainnet ⇔ prod.
  if (config.APP_ENV === 'prod' && config.CHAIN_ENVIRONMENT !== 'mainnet') {
    problems.push('APP_ENV=prod requires CHAIN_ENVIRONMENT=mainnet');
  }
  if (config.APP_ENV !== 'prod' && config.CHAIN_ENVIRONMENT === 'mainnet') {
    problems.push('only APP_ENV=prod may use CHAIN_ENVIRONMENT=mainnet');
  }
  // Things that must never be on in production.
  if (config.APP_ENV === 'prod' || config.NODE_ENV === 'production') {
    if (config.DEMO_MODE) problems.push('DEMO_MODE is forbidden in production');
    if (config.ADMIN_DEV_AUTH) problems.push('ADMIN_DEV_AUTH is forbidden in production');
  }
  if (!config.ADMIN_DEV_AUTH) {
    if (!config.ADMIN_OIDC_ISSUER) problems.push('ADMIN_OIDC_ISSUER is required');
    if (!config.ADMIN_OIDC_AUDIENCE) problems.push('ADMIN_OIDC_AUDIENCE is required');
    if (!config.ADMIN_OIDC_JWKS_URL) problems.push('ADMIN_OIDC_JWKS_URL is required');
  }
  if (config.APP_ENV === 'prod' && !config.PRIVY_APP_SECRET) {
    problems.push('PRIVY_APP_SECRET is required in production');
  }

  let keyring: { keys: Map<number, Buffer>; active: number };
  try {
    keyring = parseKeyring(config.PII_ENCRYPTION_KEYS);
  } catch (error) {
    if (error instanceof ConfigError) problems.push(...error.problems);
    keyring = { keys: new Map(), active: -1 };
  }
  if (problems.length > 0) throw new ConfigError(problems);

  return { ...config, piiKeys: keyring.keys, piiActiveKeyVersion: keyring.active };
}
