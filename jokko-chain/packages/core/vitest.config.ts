import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // Money, fees and address code: CLAUDE.md requires ≥ 90% branch coverage.
      thresholds: { branches: 90, functions: 90, lines: 90, statements: 90 },
    },
  },
});
