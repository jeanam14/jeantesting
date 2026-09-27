/**
 * Test database helpers. Integration tests run against a real PostgreSQL 16 (locally or the CI
 * service container), never against mocks: triggers, constraints and SQL behaviour are part of
 * what we test.
 */
import pg from 'pg';
import { createDatabase, type DatabaseHandle } from '../../src/database/db.js';

/** Server URL without a database (used to create/drop the throwaway test database). */
export const TEST_SERVER_URL =
  process.env['TEST_DATABASE_SERVER_URL'] ?? 'postgres://postgres:postgres@localhost:5432/postgres';

/** Name of the throwaway database. */
export const TEST_DATABASE_NAME = 'jokko_api_test';

/** URL of the throwaway test database. */
export const TEST_DATABASE_URL = (() => {
  const url = new URL(TEST_SERVER_URL);
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
})();

/** Opens a handle on the test database. Remember to `close()` it in `afterAll`. */
export function openTestDatabase(): DatabaseHandle {
  return createDatabase({ connectionString: TEST_DATABASE_URL, applicationName: 'tests' });
}

/** Drops and recreates the test database (fresh schema for every test run). */
export async function recreateTestDatabase(): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_SERVER_URL });
  await client.connect();
  try {
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
  } finally {
    await client.end();
  }
}
