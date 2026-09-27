/**
 * Applies pending SQL migrations from `apps/api/drizzle`.
 *
 * Run as a separate deploy step (`pnpm db:migrate`) with the migrator role — never at API
 * start-up, so a bad migration can't take every instance down at once and the application
 * roles never need schema privileges.
 */
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase } from './db.js';

/** Absolute path of the migrations folder, valid from both `src/` and `dist/`. */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Applies all pending migrations to the database at `connectionString`. */
export async function runMigrations(connectionString: string): Promise<void> {
  const handle = createDatabase({
    connectionString,
    maxConnections: 1,
    applicationName: 'migrator',
  });
  try {
    await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await handle.close();
  }
}

// CLI entry point: `node dist/database/migrate.js`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const url = process.env['DATABASE_URL'];
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  runMigrations(url)
    .then(() => console.log('migrations applied'))
    .catch((error: unknown) => {
      console.error('migration failed', error);
      process.exit(1);
    });
}
