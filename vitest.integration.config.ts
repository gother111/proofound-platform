import { defineConfig } from 'vitest/config';

import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.artifacts/**'],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    teardownTimeout: 5_000,
  },
});
