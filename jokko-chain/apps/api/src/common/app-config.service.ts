/**
 * Read access to runtime configuration stored in the database: feature flags, capability
 * overrides and key/value app config (min app version, thresholds, limits…). Values are cached
 * for a few seconds so a kill switch takes effect quickly without hammering the database.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
  CAPABILITIES,
  effectiveCapabilities,
  isNetworkKey,
  type Capability,
  type CapabilityOverride,
  type CapabilitySet,
  type NetworkKey,
} from '@jokko/core';
import type { Database } from '../database/db.js';
import { appConfig, capabilityOverrides, featureFlags } from '../database/schema/index.js';
import { CLOCK, DATABASE } from './tokens.js';
import type { Clock } from './clock.js';

const CACHE_TTL_MS = 5_000;

interface Snapshot {
  readonly loadedAt: number;
  readonly flags: ReadonlyMap<string, boolean>;
  readonly config: ReadonlyMap<string, unknown>;
  readonly capabilities: Record<NetworkKey, CapabilitySet>;
}

/** Cached view of flags, capabilities and app config. */
@Injectable()
export class AppConfigService {
  private snapshot: Snapshot | null = null;

  /**
   * @param db - Database handle.
   * @param clock - Time source.
   */
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Whether a feature flag is on (unknown flags are OFF). */
  async isEnabled(flag: string): Promise<boolean> {
    return (await this.load()).flags.get(flag) ?? false;
  }

  /** All flags (for the app's config endpoint). */
  async flags(): Promise<Record<string, boolean>> {
    return Object.fromEntries((await this.load()).flags);
  }

  /** A config value, or `fallback` when absent. */
  async get<T>(key: string, fallback: T): Promise<T> {
    const value = (await this.load()).config.get(key);
    return value === undefined ? fallback : (value as T);
  }

  /** Effective capabilities: static map from `@jokko/core` narrowed by server overrides. */
  async capabilities(): Promise<Record<NetworkKey, CapabilitySet>> {
    return (await this.load()).capabilities;
  }

  /** Whether `capability` is currently available on `network`. */
  async hasCapability(network: NetworkKey, capability: Capability): Promise<boolean> {
    return (await this.capabilities())[network][capability];
  }

  /** Drops the cache (after an admin change in this process). */
  invalidate(): void {
    this.snapshot = null;
  }

  private async load(): Promise<Snapshot> {
    const now = this.clock.now().getTime();
    if (this.snapshot && now - this.snapshot.loadedAt < CACHE_TTL_MS) return this.snapshot;
    const [flagRows, configRows, overrideRows] = await Promise.all([
      this.db.select().from(featureFlags),
      this.db.select().from(appConfig),
      this.db.select().from(capabilityOverrides),
    ]);
    const overrides: CapabilityOverride[] = overrideRows
      .filter(
        (row) =>
          isNetworkKey(row.network) && (CAPABILITIES as readonly string[]).includes(row.capability),
      )
      .map((row) => ({
        network: row.network,
        capability: row.capability as Capability,
        enabled: row.enabled,
      }));
    this.snapshot = {
      loadedAt: now,
      flags: new Map(flagRows.map((f) => [f.key, f.enabled])),
      config: new Map(configRows.map((c) => [c.key, c.valueJson])),
      capabilities: effectiveCapabilities(overrides),
    };
    return this.snapshot;
  }
}
