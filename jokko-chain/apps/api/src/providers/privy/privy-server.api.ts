/**
 * Server-side Privy API adapter (user look-ups and wallet pre-generation for phone sends).
 *
 * WHAT THIS MAY DO (CLAUDE.md rules 1-3, 6):
 * - read a user's linked accounts (phone, email, passkeys, embedded wallet ADDRESSES);
 * - create a user for a phone number with pre-generated self-custodial wallets (phone send).
 *
 * WHAT THIS MUST NEVER DO: sign, add signers/session signers, enable delegated actions, create
 * custodial wallets, or export keys. The adapter deliberately exposes no such method, and
 * {@link toPrivyUser} flags any wallet reported as `delegated` or `imported` so the caller can
 * raise a critical alert (a delegated wallet would mean someone enabled server-side signing).
 *
 * Endpoints (https://docs.privy.io/api-reference): `GET /v1/users/{id}`,
 * `POST /v1/users/phone/number`, `POST /v1/users`. Auth: HTTP Basic (app ID : app secret) plus
 * the `privy-app-id` header. Field names verified against Privy's official Go SDK (2026-09).
 */
import { parsePhoneNumber as parseE164 } from 'libphonenumber-js/min';
import { z } from 'zod';
import { ApiError } from '../../common/errors.js';
import { parseProviderJson, providerFetch } from '../http.js';

/** Wallet chain types we create or read. */
export type PrivyChainType = 'ethereum' | 'solana' | 'bitcoin-segwit' | 'tron';

/** An embedded (self-custodial) wallet as reported by Privy. */
export interface PrivyEmbeddedWallet {
  readonly walletId: string;
  readonly address: string;
  readonly chainType: string;
  readonly recoveryMethod: string | null;
  /** MUST be false: `true` means server-side signing was enabled (rule 1 violation). */
  readonly delegated: boolean;
  /** Imported keys are not supported (P13). */
  readonly imported: boolean;
}

/** The parts of a Privy user Jokko needs. */
export interface PrivyUser {
  readonly id: string;
  /** Verified phone in E.164, or null. */
  readonly phoneE164: string | null;
  readonly email: { readonly address: string; readonly verified: boolean } | null;
  /** Passkeys enrolled as MFA (wallet protection, security level 2). */
  readonly passkeyMfa: boolean;
  readonly mfaMethods: readonly string[];
  readonly wallets: readonly PrivyEmbeddedWallet[];
}

/** Port used by the domain code. */
export interface PrivyServerApi {
  /** Returns the user or `null` when Privy does not know the ID. */
  getUser(privyUserId: string): Promise<PrivyUser | null>;
  /** Returns the user linked to this E.164 phone, or `null`. */
  findUserByPhone(e164: string): Promise<PrivyUser | null>;
  /**
   * Creates a user for a phone number with pre-generated self-custodial wallets (phone send to
   * a non-user, CLAUDE.md rule 3). The person gets the wallets by logging in with that phone.
   */
  createUserForPhone(e164: string, chains: readonly PrivyChainType[]): Promise<PrivyUser>;
}

/** DI token for {@link PrivyServerApi}. */
export const PRIVY_SERVER_API = Symbol('PRIVY_SERVER_API');

// --- Response parsing -----------------------------------------------------------------------

const linkedAccount = z.looseObject({ type: z.string() });
const userSchema = z.looseObject({
  id: z.string().startsWith('did:privy:'),
  linked_accounts: z.array(linkedAccount),
  mfa_methods: z.array(z.looseObject({ type: z.string() })).optional(),
});

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toE164(value: string | null): string | null {
  if (!value) return null;
  try {
    return parseE164(value).number;
  } catch {
    return null;
  }
}

/** Maps a raw Privy user JSON object to {@link PrivyUser}. Exported for tests. */
export function toPrivyUser(raw: unknown): PrivyUser {
  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('PROVIDER_ERROR', 'privy: unexpected user format');
  const accounts = parsed.data.linked_accounts as Record<string, unknown>[];
  let phoneE164: string | null = null;
  let email: PrivyUser['email'] = null;
  let passkeyMfa = false;
  const wallets: PrivyEmbeddedWallet[] = [];
  for (const account of accounts) {
    switch (account['type']) {
      case 'phone':
        phoneE164 ??= toE164(str(account['phoneNumber']) ?? str(account['number']));
        break;
      case 'email': {
        const address = str(account['address']);
        if (address) email = { address, verified: typeof account['verified_at'] === 'number' };
        break;
      }
      case 'passkey':
        if (account['enrolled_in_mfa'] === true) passkeyMfa = true;
        break;
      case 'wallet': {
        // Only Privy embedded wallets; externally connected wallets are ignored.
        if (account['connector_type'] !== 'embedded' || account['wallet_client_type'] !== 'privy')
          break;
        const address = str(account['address']);
        const chainType = str(account['chain_type']);
        if (!address || !chainType) break;
        wallets.push({
          walletId: str(account['id']) ?? '',
          address,
          chainType,
          recoveryMethod: str(account['recovery_method']),
          delegated: account['delegated'] === true,
          imported: account['imported'] === true,
        });
        break;
      }
      default:
        break;
    }
  }
  const mfaMethods = (parsed.data.mfa_methods ?? []).map((m) => m.type);
  return {
    id: parsed.data.id,
    phoneE164,
    email,
    passkeyMfa: passkeyMfa || mfaMethods.includes('passkey'),
    mfaMethods,
    wallets,
  };
}

// --- HTTP implementation --------------------------------------------------------------------

/** Real adapter calling `https://api.privy.io`. */
export class HttpPrivyServerApi implements PrivyServerApi {
  private readonly authorization: string;

  /**
   * @param appId - Privy app ID.
   * @param appSecret - Privy app secret (server-only; never logged).
   * @param baseUrl - API base URL.
   */
  constructor(
    private readonly appId: string,
    appSecret: string,
    private readonly baseUrl = 'https://api.privy.io',
  ) {
    this.authorization = `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`;
  }

  /** {@inheritDoc PrivyServerApi.getUser} */
  async getUser(privyUserId: string): Promise<PrivyUser | null> {
    const response = await providerFetch({
      provider: 'privy',
      method: 'GET',
      url: `${this.baseUrl}/v1/users/${encodeURIComponent(privyUserId)}`,
      headers: this.headers(),
      passthroughStatuses: [404],
    });
    if (response.status === 404) return null;
    return toPrivyUser(parseProviderJson('privy', response.text));
  }

  /** {@inheritDoc PrivyServerApi.findUserByPhone} */
  async findUserByPhone(e164: string): Promise<PrivyUser | null> {
    const response = await providerFetch({
      provider: 'privy',
      method: 'POST',
      url: `${this.baseUrl}/v1/users/phone/number`,
      headers: this.headers(),
      body: { number: e164 },
      passthroughStatuses: [404],
    });
    if (response.status === 404) return null;
    return toPrivyUser(parseProviderJson('privy', response.text));
  }

  /** {@inheritDoc PrivyServerApi.createUserForPhone} */
  async createUserForPhone(e164: string, chains: readonly PrivyChainType[]): Promise<PrivyUser> {
    const response = await providerFetch({
      provider: 'privy',
      method: 'POST',
      url: `${this.baseUrl}/v1/users`,
      headers: this.headers(),
      body: {
        linked_accounts: [{ type: 'phone', number: e164 }],
        // Self-custodial embedded wallets only. No signers, no delegation, no custody.
        wallets: chains.map((chainType) => ({ chain_type: chainType })),
      },
      timeoutMs: 15_000,
    });
    return toPrivyUser(parseProviderJson('privy', response.text));
  }

  private headers(): Record<string, string> {
    return { authorization: this.authorization, 'privy-app-id': this.appId };
  }
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Minimal base58 encoder so the fake can produce well-formed Solana addresses. */
function base58(bytes: Buffer): string {
  let value = BigInt(`0x${bytes.toString('hex')}`);
  let out = '';
  while (value > 0n) {
    out = (BASE58[Number(value % 58n)] ?? '') + out;
    value /= 58n;
  }
  return out;
}

// --- In-memory implementation (local development and tests only) ---------------------------

/**
 * Deterministic fake for local development without Privy credentials and for tests. Refused in
 * production by the provider factory.
 */
export class InMemoryPrivyServerApi implements PrivyServerApi {
  private readonly users = new Map<string, PrivyUser>();
  private counter = 0;

  /** Adds or replaces a user (tests). */
  put(user: PrivyUser): void {
    this.users.set(user.id, user);
  }

  /** {@inheritDoc PrivyServerApi.getUser} */
  getUser(privyUserId: string): Promise<PrivyUser | null> {
    return Promise.resolve(this.users.get(privyUserId) ?? null);
  }

  /** {@inheritDoc PrivyServerApi.findUserByPhone} */
  findUserByPhone(e164: string): Promise<PrivyUser | null> {
    return Promise.resolve([...this.users.values()].find((u) => u.phoneE164 === e164) ?? null);
  }

  /** {@inheritDoc PrivyServerApi.createUserForPhone} */
  createUserForPhone(e164: string, chains: readonly PrivyChainType[]): Promise<PrivyUser> {
    this.counter += 1;
    const n = this.counter.toString(16).padStart(40, '0');
    const user: PrivyUser = {
      id: `did:privy:fake${this.counter}`,
      phoneE164: e164,
      email: null,
      passkeyMfa: false,
      mfaMethods: [],
      wallets: chains.map((chainType) => ({
        walletId: `fake-${chainType}-${this.counter}`,
        address:
          chainType === 'solana' ? base58(Buffer.from(n.slice(0, 32).padEnd(32, '1'))) : `0x${n}`,
        chainType,
        recoveryMethod: 'privy',
        delegated: false,
        imported: false,
      })),
    };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }
}
