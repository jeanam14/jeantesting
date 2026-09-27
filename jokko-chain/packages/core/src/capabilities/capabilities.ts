/**
 * What each network can do in THIS build of the software (the capability matrix in CLAUDE.md).
 *
 * Rule (docs/01-architecture.md, principle 4): the static map below is the maximum. The server
 * can switch a capability **off** (kill switch, incident, not launched yet), but it can never
 * switch on something this code does not support. {@link effectiveCapabilities} enforces it.
 */
import type { NetworkKey } from '../networks/networks.js';

/** Things a user can do on a network. */
export type Capability =
  | 'send'
  | 'receive'
  | 'swap'
  | 'stake'
  | 'borrow'
  | 'phoneSend'
  | 'gasless'
  | 'cardSpend'
  | 'rampOn'
  | 'rampOff';

/** All capabilities, for iteration. */
export const CAPABILITIES: readonly Capability[] = [
  'send',
  'receive',
  'swap',
  'stake',
  'borrow',
  'phoneSend',
  'gasless',
  'cardSpend',
  'rampOn',
  'rampOff',
];

/** Capability set of one network. */
export type CapabilitySet = Readonly<Record<Capability, boolean>>;

function set(enabled: readonly Capability[]): CapabilitySet {
  return Object.fromEntries(CAPABILITIES.map((c) => [c, enabled.includes(c)])) as Record<
    Capability,
    boolean
  >;
}

/**
 * Maximum capabilities supported by this code version.
 *
 * - `stake`: ETH and SOL only at launch (D16); POL staking not implemented yet.
 * - `borrow`, `cardSpend`: not implemented yet (after launch).
 * - `phoneSend` to non-users: only where the audited escrow contract is deployed (P2).
 * - `gasless`: EIP-7702 on EVM (D14), Kora on Solana; never on Bitcoin; Tron via energy only,
 *   not implemented yet.
 * - `rampOn`/`rampOff`: networks the ramp providers deliver to (to confirm with each, O2/O3).
 */
export const STATIC_CAPABILITIES: Readonly<Record<NetworkKey, CapabilitySet>> = {
  polygon: set(['send', 'receive', 'swap', 'phoneSend', 'gasless', 'rampOn', 'rampOff']),
  ethereum: set(['send', 'receive', 'swap', 'stake', 'phoneSend', 'gasless', 'rampOn', 'rampOff']),
  bsc: set(['send', 'receive', 'swap', 'gasless', 'rampOn', 'rampOff']),
  solana: set(['send', 'receive', 'swap', 'stake', 'gasless', 'rampOn', 'rampOff']),
  tron: set(['send', 'receive', 'swap', 'rampOn', 'rampOff']),
  bitcoin: set(['send', 'receive', 'swap']),
};

/** A server-side override: `enabled: false` disables; `enabled: true` is ignored if unsupported. */
export interface CapabilityOverride {
  readonly network: NetworkKey;
  readonly capability: Capability;
  readonly enabled: boolean;
}

/**
 * Combines the static map with server overrides. An override can only narrow: a `true`
 * override for a capability the code doesn't support is ignored (and should be alerted on).
 */
export function effectiveCapabilities(
  overrides: readonly CapabilityOverride[],
): Record<NetworkKey, CapabilitySet> {
  const result = Object.fromEntries(
    Object.entries(STATIC_CAPABILITIES).map(([network, caps]) => [network, { ...caps }]),
  ) as Record<NetworkKey, Record<Capability, boolean>>;
  for (const override of overrides) {
    const supported = STATIC_CAPABILITIES[override.network][override.capability];
    result[override.network][override.capability] = supported && override.enabled;
  }
  return result;
}

/** Overrides that try to enable something the code cannot do (to log/alert, never apply). */
export function invalidEnableOverrides(
  overrides: readonly CapabilityOverride[],
): CapabilityOverride[] {
  return overrides.filter((o) => o.enabled && !STATIC_CAPABILITIES[o.network][o.capability]);
}
