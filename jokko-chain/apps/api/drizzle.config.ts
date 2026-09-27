import { defineConfig } from 'drizzle-kit';

// Migration generation only (drizzle-kit generate). Migrations are plain SQL files in
// ./drizzle, reviewed in pull requests and applied by `pnpm db:migrate` as a separate deploy
// step — never automatically at application start-up.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
});
