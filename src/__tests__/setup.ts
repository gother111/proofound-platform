import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests (supports .env.local)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Provide Vite SSR helper expected by Next.js transforms during Vitest
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__vite_ssr_exportName__ =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__vite_ssr_exportName__ || ((_name: string, value: any) => value);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
