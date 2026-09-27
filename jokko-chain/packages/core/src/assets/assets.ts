/**
 * Curated allowlist of assets the app shows (P7): anything not listed here is hidden, which
 * keeps scam airdrop tokens out of the asset list (docs/02-security.md, T8).
 *
 * ⚠ CONTRACT ADDRESSES ARE SECURITY-CRITICAL. A wrong address means users send real money to a
 * fake token. Every entry therefore carries a `review` record, and the API refuses to enable
 * an asset on mainnet until its review status is `reviewed` (checked at start-up). A human
 * must compare each address with the issuer's official documentation and record the date and
 * reviewer. Addresses below were entered from well-known public sources and are awaiting
 * that review.
 */
import { JokkoCoreError } from '../errors.js';
import type { ChainEnvironment, NetworkKey } from '../networks/networks.js';

/** Stable asset identifier: `<symbol>:<network>`, lower-case (e.g. `usdc:polygon`). */
export type AssetId = `${string}:${NetworkKey}`;

/** Human review status of an asset's contract addresses. */
export interface AssetReview {
  /** `reviewed` only once a person has checked every address against the issuer's docs. */
  readonly status: 'pending-review' | 'reviewed';
  /** Where the address comes from (issuer documentation URL). */
  readonly source: string;
  /** Reviewer name and date, once reviewed. */
  readonly reviewedBy?: string;
  readonly reviewedAt?: string;
}

/** One asset on one network. */
export interface AssetDefinition {
  readonly id: AssetId;
  readonly symbol: string;
  readonly name: string;
  readonly network: NetworkKey;
  /** `native` for the network's own coin, otherwise a token contract / mint. */
  readonly kind: 'native' | 'token';
  /**
   * Token contract (EVM, Tron) or mint (Solana) per environment. `null` means the asset is
   * not available in that environment (it is then hidden there).
   */
  readonly contract: Readonly<Record<ChainEnvironment, string | null>>;
  /**
   * Decimals of the on-chain representation. ⚠ Not always 6 for stablecoins: USDC and USDT
   * on BNB Chain use 18.
   */
  readonly decimals: number;
  readonly isStablecoin: boolean;
  /** Identifier at the price provider (CoinGecko). */
  readonly priceId: string;
  readonly review: AssetReview;
}

const CIRCLE_DOCS = 'https://developers.circle.com/stablecoins/usdc-contract-addresses';
const TETHER_DOCS = 'https://tether.to/en/supported-protocols';

/** The allowlist. Order = display order within a network. */
export const ASSETS: readonly AssetDefinition[] = [
  // --- Stablecoins -------------------------------------------------------------------------
  {
    id: 'usdc:polygon',
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'polygon',
    kind: 'token',
    contract: {
      mainnet: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      testnet: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    },
    decimals: 6,
    isStablecoin: true,
    priceId: 'usd-coin',
    review: { status: 'pending-review', source: CIRCLE_DOCS },
  },
  {
    id: 'usdc:ethereum',
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'ethereum',
    kind: 'token',
    contract: {
      mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      testnet: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
    decimals: 6,
    isStablecoin: true,
    priceId: 'usd-coin',
    review: { status: 'pending-review', source: CIRCLE_DOCS },
  },
  {
    id: 'usdc:bsc',
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'bsc',
    kind: 'token',
    contract: { mainnet: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', testnet: null },
    decimals: 18,
    isStablecoin: true,
    priceId: 'usd-coin',
    review: {
      status: 'pending-review',
      source: 'https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    },
  },
  {
    id: 'usdc:solana',
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'solana',
    kind: 'token',
    contract: {
      mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    },
    decimals: 6,
    isStablecoin: true,
    priceId: 'usd-coin',
    review: { status: 'pending-review', source: CIRCLE_DOCS },
  },
  {
    id: 'usdt:polygon',
    symbol: 'USDT',
    name: 'Tether',
    network: 'polygon',
    kind: 'token',
    contract: { mainnet: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', testnet: null },
    decimals: 6,
    isStablecoin: true,
    priceId: 'tether',
    review: { status: 'pending-review', source: TETHER_DOCS },
  },
  {
    id: 'usdt:ethereum',
    symbol: 'USDT',
    name: 'Tether',
    network: 'ethereum',
    kind: 'token',
    contract: { mainnet: '0xdAC17F958D2ee523a2206206994597C13D831ec7', testnet: null },
    decimals: 6,
    isStablecoin: true,
    priceId: 'tether',
    review: { status: 'pending-review', source: TETHER_DOCS },
  },
  {
    id: 'usdt:bsc',
    symbol: 'USDT',
    name: 'Tether',
    network: 'bsc',
    kind: 'token',
    contract: { mainnet: '0x55d398326f99059fF775485246999027B3197955', testnet: null },
    decimals: 18,
    isStablecoin: true,
    priceId: 'tether',
    review: { status: 'pending-review', source: TETHER_DOCS },
  },
  {
    id: 'usdt:solana',
    symbol: 'USDT',
    name: 'Tether',
    network: 'solana',
    kind: 'token',
    contract: { mainnet: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', testnet: null },
    decimals: 6,
    isStablecoin: true,
    priceId: 'tether',
    review: { status: 'pending-review', source: TETHER_DOCS },
  },
  {
    id: 'usdt:tron',
    symbol: 'USDT',
    name: 'Tether',
    network: 'tron',
    kind: 'token',
    contract: { mainnet: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', testnet: null },
    decimals: 6,
    isStablecoin: true,
    priceId: 'tether',
    review: { status: 'pending-review', source: TETHER_DOCS },
  },
  // --- Native coins ------------------------------------------------------------------------
  nativeAsset('eth:ethereum', 'ETH', 'Ethereum', 'ethereum', 18, 'ethereum'),
  nativeAsset('pol:polygon', 'POL', 'Polygon', 'polygon', 18, 'polygon-ecosystem-token'),
  nativeAsset('bnb:bsc', 'BNB', 'BNB', 'bsc', 18, 'binancecoin'),
  nativeAsset('sol:solana', 'SOL', 'Solana', 'solana', 9, 'solana'),
  nativeAsset('trx:tron', 'TRX', 'Tron', 'tron', 6, 'tron'),
  nativeAsset('btc:bitcoin', 'BTC', 'Bitcoin', 'bitcoin', 8, 'bitcoin'),
];

/** Native coins have no contract, so there is nothing to mis-type: they are reviewed by design. */
function nativeAsset(
  id: AssetId,
  symbol: string,
  name: string,
  network: NetworkKey,
  decimals: number,
  priceId: string,
): AssetDefinition {
  return {
    id,
    symbol,
    name,
    network,
    kind: 'native',
    contract: { mainnet: null, testnet: null },
    decimals,
    isStablecoin: false,
    priceId,
    review: { status: 'reviewed', source: 'native coin (no contract)' },
  };
}

const ASSETS_BY_ID: ReadonlyMap<string, AssetDefinition> = new Map(ASSETS.map((a) => [a.id, a]));

/** Returns an asset definition or throws `UNKNOWN_ASSET`. */
export function getAsset(id: string): AssetDefinition {
  const asset = ASSETS_BY_ID.get(id);
  if (!asset) throw new JokkoCoreError('UNKNOWN_ASSET', `unknown asset: ${id}`);
  return asset;
}

/**
 * Assets usable in an environment: native coins always, tokens only if they have a contract
 * there. On `mainnet`, tokens must also have passed human review.
 */
export function availableAssets(environment: ChainEnvironment): AssetDefinition[] {
  return ASSETS.filter((asset) => {
    if (asset.kind === 'native') return true;
    if (asset.contract[environment] === null) return false;
    return environment === 'testnet' || asset.review.status === 'reviewed';
  });
}

/** Mainnet assets whose addresses still await human review (checked at API start-up). */
export function assetsPendingReview(): AssetDefinition[] {
  return ASSETS.filter((a) => a.kind === 'token' && a.review.status !== 'reviewed');
}

/**
 * Finds an allowlisted asset by its on-chain contract in an environment. Comparison is
 * case-insensitive for EVM hex addresses and exact for base58 (Solana, Tron). Returns
 * `undefined` for unknown contracts, which callers must treat as "hide / possible spam".
 */
export function findAssetByContract(
  network: NetworkKey,
  environment: ChainEnvironment,
  contract: string,
): AssetDefinition | undefined {
  const isHex = contract.startsWith('0x');
  return ASSETS.find((asset) => {
    const known = asset.contract[environment];
    if (asset.network !== network || known === null) return false;
    return isHex ? known.toLowerCase() === contract.toLowerCase() : known === contract;
  });
}
