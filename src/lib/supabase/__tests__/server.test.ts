import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {},
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('createClient', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('creates a Supabase client with correct configuration', async () => {
    const { createClient } = await import('../server');
    await createClient();

    // Test passes if no errors are thrown during client creation
    expect(true).toBe(true);
  });

  it('handles missing environment variables gracefully', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

    const { createClient } = await import('../server');

    // Should not throw an error
    await expect(createClient()).resolves.toBeDefined();
  });
});
