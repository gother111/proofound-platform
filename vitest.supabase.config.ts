import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Increase timeout for integration tests (Supabase API calls can be slow)
    testTimeout: 30000,
    // Run tests sequentially to avoid race conditions with test data
    sequence: {
      concurrent: false,
    },
    // Setup file for loading environment variables
    setupFiles: ['./tests/privacy/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
