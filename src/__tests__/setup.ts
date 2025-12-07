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
