// Vitest helpers expected by Vite SSR transforms (safeguard for non-Vite envs)
const ssrExports =
  (globalThis as unknown as Record<string, unknown>).__vite_ssr_exports__ ||
  ((globalThis as unknown as Record<string, unknown>).__vite_ssr_exports__ = {});

(globalThis as unknown as Record<string, unknown>).__vite_ssr_exportName__ =
  (globalThis as unknown as Record<string, unknown>).__vite_ssr_exportName__ ||
  ((name: string, value: unknown) => {
    (ssrExports as Record<string, unknown>)[name] = value;
    return value;
  });

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests (supports .env.local)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Cleanup after each test
afterEach(() => {
  cleanup();
});
