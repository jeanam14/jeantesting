/**
 * Global infrastructure module shared by the public API, the admin API and the workers:
 * configuration, database, encryption, clock, audit, jobs, idempotency and runtime config.
 */
import {
  Global,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import type { AppConfig } from '../config/env.js';
import { createDatabase, type DatabaseHandle } from '../database/db.js';
import { AppConfigService } from './app-config.service.js';
import { AuditService } from './audit.service.js';
import { systemClock, type Clock } from './clock.js';
import { FieldEncryption } from './crypto/field-encryption.js';
import { IdempotencyService } from './idempotency.service.js';
import { JobsService } from './jobs.service.js';
import { APP_CONFIG, CLOCK, DATABASE, DATABASE_HANDLE } from './tokens.js';

/** Options for {@link CoreModule.forRoot}. */
export interface CoreModuleOptions {
  readonly config: AppConfig;
  /** `pg_stat_activity` tag. */
  readonly applicationName: 'api' | 'admin-api' | 'worker' | 'tests';
  /** Override the clock (tests). */
  readonly clock?: Clock;
  /** Reuse an existing database handle (tests). */
  readonly database?: DatabaseHandle;
}

/** Closes the connection pool on shutdown. */
class DatabaseLifecycle implements OnApplicationShutdown {
  /** @param handle - Pool to close. */
  constructor(@Inject(DATABASE_HANDLE) private readonly handle: DatabaseHandle) {}

  /** Nest shutdown hook. */
  async onApplicationShutdown(): Promise<void> {
    await this.handle.close();
  }
}

/** See file header. */
@Global()
@Module({})
export class CoreModule {
  /** Builds the module for one process. */
  static forRoot(options: CoreModuleOptions): DynamicModule {
    const handle =
      options.database ??
      createDatabase({
        connectionString: options.config.DATABASE_URL,
        maxConnections: options.config.DATABASE_POOL_MAX,
        applicationName: options.applicationName,
      });
    const encryption = new FieldEncryption(
      options.config.piiKeys,
      options.config.piiActiveKeyVersion,
      Buffer.from(options.config.PII_HMAC_KEY, 'base64'),
    );
    const providers = [
      { provide: APP_CONFIG, useValue: options.config },
      { provide: DATABASE_HANDLE, useValue: handle },
      { provide: DATABASE, useValue: handle.db },
      { provide: CLOCK, useValue: options.clock ?? systemClock },
      { provide: FieldEncryption, useValue: encryption },
      AuditService,
      JobsService,
      IdempotencyService,
      AppConfigService,
      ...(options.database ? [] : [DatabaseLifecycle]),
    ];
    return {
      module: CoreModule,
      providers,
      exports: [
        APP_CONFIG,
        DATABASE_HANDLE,
        DATABASE,
        CLOCK,
        FieldEncryption,
        AuditService,
        JobsService,
        IdempotencyService,
        AppConfigService,
      ],
    };
  }
}
