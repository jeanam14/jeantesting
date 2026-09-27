/**
 * Runs once before all test files: creates a fresh test database and applies every migration
 * exactly as production would (the migration files themselves are under test).
 */
import { runMigrations } from '../src/database/migrate.js';
import { recreateTestDatabase, TEST_DATABASE_URL } from './support/database.js';

export default async function setup(): Promise<void> {
  await recreateTestDatabase();
  await runMigrations(TEST_DATABASE_URL);
}
