/**
 * Database connection (node-postgres pool + Drizzle).
 *
 * One pool per process. Every query goes through Drizzle's typed query builder: no string
 * concatenation of SQL anywhere in the codebase (injection-safe by construction).
 */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';

/** Typed database handle used throughout the API. */
export type Database = NodePgDatabase<typeof schema>;

/** A transaction handle (same API as {@link Database}). */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Handle returned by {@link createDatabase}. */
export interface DatabaseHandle {
  readonly db: Database;
  readonly pool: pg.Pool;
  /** Closes all connections (graceful shutdown, tests). */
  close(): Promise<void>;
}

/** Options for {@link createDatabase}. */
export interface CreateDatabaseOptions {
  readonly connectionString: string;
  readonly maxConnections?: number;
  /** Tag visible in `pg_stat_activity` (api / admin-api / worker). */
  readonly applicationName: string;
}

/** Opens a connection pool and returns the typed Drizzle handle. */
export function createDatabase(options: CreateDatabaseOptions): DatabaseHandle {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
    application_name: options.applicationName,
    // Fail fast instead of hanging requests when the database is unreachable.
    connectionTimeoutMillis: 5_000,
    // Kill runaway queries (defence against accidental full scans).
    statement_timeout: 15_000,
    idle_in_transaction_session_timeout: 30_000,
  });
  const db = drizzle(pool, { schema });
  return { db, pool, close: () => pool.end() };
}
