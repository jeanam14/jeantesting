/**
 * The blockchain networks Jokko Chain supports (D15) and their per-environment deployments.
 *
 * One EVM wallet (same address) covers Ethereum, Polygon and BNB Chain. Solana, Tron and
 * Bitcoin each have their own wallet. Test builds only ever see `testnet` deployments: the
 * environment is compiled into the app and asserted at start-up (docs/01-architecture.md §5).
 */
import { JokkoCoreError } from '../errors.js';
import type { Locale } from '../money/format.js';

/** Stable identifier of a supported network. Stored in the database; never rename. */
export type NetworkKey = 'ethereum' | 'polygon' | 'bsc' | 'solana' | 'tron' | 'bitcoin';

/** Wallet/key family: networks in the same family share one address per user. */
export type NetworkFamily = 'evm' | 'solana' | 'tron' | 'bitcoin';

/** `testnet` for dev/staging builds, `mainnet` for production only. */
export type ChainEnvironment = 'mainnet' | 'testnet';

/** Where a network lives in one environment. */
export interface NetworkDeployment {
  /** Human name of the chain instance, e.g. "Sepolia". */
  readonly name: string;
  /** EIP-155 chain ID (EVM networks only). */
  readonly evmChainId?: number;
  /** Block explorer URL for a transaction; `{hash}` is replaced by the transaction hash. */
  readonly explorerTxUrl: string;
  /** Block explorer URL for an address; `{address}` is replaced. */
  readonly explorerAddressUrl: string;
}

/** Everything the app and API need to know about one network. */
export interface NetworkDefinition {
  readonly key: NetworkKey;
  readonly family: NetworkFamily;
  /** Label shown to users (D7): familiar names including the token standard people know. */
  readonly label: Readonly<Record<Locale, string>>;
  /** Native coin used for network fees. */
  readonly nativeAsset: { readonly symbol: string; readonly decimals: number };
  /** Whether the network supports EIP-7702 delegation (gasless + batching, D14). */
  readonly supportsEip7702: boolean;
  /** Mainnet and testnet deployments. */
  readonly deployments: Readonly<Record<ChainEnvironment, NetworkDeployment>>;
}

/** Registry of supported networks, in display order (cheapest everyday network first). */
export const NETWORKS: Readonly<Record<NetworkKey, NetworkDefinition>> = {
  polygon: {
    key: 'polygon',
    family: 'evm',
    label: { fr: 'Polygon', en: 'Polygon' },
    nativeAsset: { symbol: 'POL', decimals: 18 },
    supportsEip7702: true,
    deployments: {
      mainnet: {
        name: 'Polygon PoS',
        evmChainId: 137,
        explorerTxUrl: 'https://polygonscan.com/tx/{hash}',
        explorerAddressUrl: 'https://polygonscan.com/address/{address}',
      },
      testnet: {
        name: 'Polygon Amoy',
        evmChainId: 80002,
        explorerTxUrl: 'https://amoy.polygonscan.com/tx/{hash}',
        explorerAddressUrl: 'https://amoy.polygonscan.com/address/{address}',
      },
    },
  },
  ethereum: {
    key: 'ethereum',
    family: 'evm',
    label: { fr: 'Ethereum (ERC20)', en: 'Ethereum (ERC20)' },
    nativeAsset: { symbol: 'ETH', decimals: 18 },
    supportsEip7702: true,
    deployments: {
      mainnet: {
        name: 'Ethereum',
        evmChainId: 1,
        explorerTxUrl: 'https://etherscan.io/tx/{hash}',
        explorerAddressUrl: 'https://etherscan.io/address/{address}',
      },
      testnet: {
        name: 'Sepolia',
        evmChainId: 11155111,
        explorerTxUrl: 'https://sepolia.etherscan.io/tx/{hash}',
        explorerAddressUrl: 'https://sepolia.etherscan.io/address/{address}',
      },
    },
  },
  bsc: {
    key: 'bsc',
    family: 'evm',
    label: { fr: 'BNB Chain (BEP20)', en: 'BNB Chain (BEP20)' },
    nativeAsset: { symbol: 'BNB', decimals: 18 },
    supportsEip7702: true,
    deployments: {
      mainnet: {
        name: 'BNB Smart Chain',
        evmChainId: 56,
        explorerTxUrl: 'https://bscscan.com/tx/{hash}',
        explorerAddressUrl: 'https://bscscan.com/address/{address}',
      },
      testnet: {
        name: 'BNB Smart Chain Testnet',
        evmChainId: 97,
        explorerTxUrl: 'https://testnet.bscscan.com/tx/{hash}',
        explorerAddressUrl: 'https://testnet.bscscan.com/address/{address}',
      },
    },
  },
  solana: {
    key: 'solana',
    family: 'solana',
    label: { fr: 'Solana', en: 'Solana' },
    nativeAsset: { symbol: 'SOL', decimals: 9 },
    supportsEip7702: false,
    deployments: {
      mainnet: {
        name: 'Solana',
        explorerTxUrl: 'https://solscan.io/tx/{hash}',
        explorerAddressUrl: 'https://solscan.io/account/{address}',
      },
      testnet: {
        name: 'Solana Devnet',
        explorerTxUrl: 'https://solscan.io/tx/{hash}?cluster=devnet',
        explorerAddressUrl: 'https://solscan.io/account/{address}?cluster=devnet',
      },
    },
  },
  tron: {
    key: 'tron',
    family: 'tron',
    label: { fr: 'Tron (TRC20)', en: 'Tron (TRC20)' },
    nativeAsset: { symbol: 'TRX', decimals: 6 },
    supportsEip7702: false,
    deployments: {
      mainnet: {
        name: 'Tron',
        explorerTxUrl: 'https://tronscan.org/#/transaction/{hash}',
        explorerAddressUrl: 'https://tronscan.org/#/address/{address}',
      },
      testnet: {
        name: 'Tron Nile',
        explorerTxUrl: 'https://nile.tronscan.org/#/transaction/{hash}',
        explorerAddressUrl: 'https://nile.tronscan.org/#/address/{address}',
      },
    },
  },
  bitcoin: {
    key: 'bitcoin',
    family: 'bitcoin',
    label: { fr: 'Bitcoin', en: 'Bitcoin' },
    nativeAsset: { symbol: 'BTC', decimals: 8 },
    supportsEip7702: false,
    deployments: {
      mainnet: {
        name: 'Bitcoin',
        explorerTxUrl: 'https://mempool.space/tx/{hash}',
        explorerAddressUrl: 'https://mempool.space/address/{address}',
      },
      testnet: {
        name: 'Bitcoin Testnet4',
        explorerTxUrl: 'https://mempool.space/testnet4/tx/{hash}',
        explorerAddressUrl: 'https://mempool.space/testnet4/address/{address}',
      },
    },
  },
};

/** All network keys in display order. */
export const NETWORK_KEYS: readonly NetworkKey[] = Object.keys(NETWORKS) as NetworkKey[];

/** Type guard for {@link NetworkKey}. */
export function isNetworkKey(value: string): value is NetworkKey {
  return Object.hasOwn(NETWORKS, value);
}

/** Returns a network definition, throwing `UNKNOWN_NETWORK` for anything unsupported. */
export function getNetwork(key: string): NetworkDefinition {
  if (!isNetworkKey(key)) {
    throw new JokkoCoreError('UNKNOWN_NETWORK', `unsupported network: ${key}`);
  }
  return NETWORKS[key];
}

/** Networks that share the given family (e.g. `evm` → polygon, ethereum, bsc). */
export function networksInFamily(family: NetworkFamily): NetworkDefinition[] {
  return NETWORK_KEYS.map((key) => NETWORKS[key]).filter((n) => n.family === family);
}

/** Builds the explorer link for a transaction on a network in an environment. */
export function explorerTxUrl(
  key: NetworkKey,
  environment: ChainEnvironment,
  hash: string,
): string {
  return NETWORKS[key].deployments[environment].explorerTxUrl.replace(
    '{hash}',
    encodeURIComponent(hash),
  );
}
