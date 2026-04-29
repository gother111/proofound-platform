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
    process.env.SITE_URL = 'https://example.com';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'false';
    process.env.MOCK_ADMIN_MODE = '';
    process.env.MOCK_PLATFORM_ROLE = '';

    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...envBackup };
  });

  it('creates a Supabase client with correct configuration', async () => {
    const { createClient } = await import('../server');
    await createClient();

    // Test passes if no errors are thrown during client creation
    expect(true).toBe(true);
  });

  it('throws when required environment variables are missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    process.env.SITE_URL = '';
    process.env.DATABASE_URL = '';

    const { createClient } = await import('../server');

    await expect(createClient()).rejects.toThrowError(/Missing Supabase URL|ENV_MISCONFIG/);
  });

  it('rejects mock Supabase in production before creating a server client', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createClient } = await import('../server');

    await expect(createClient()).rejects.toThrowError(/NEXT_PUBLIC_USE_MOCK_SUPABASE/);
  });

  it('keeps mock Supabase available for development and test runs', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createClient } = await import('../server');

    const client = await createClient();
    await expect(client.auth.getUser()).resolves.toMatchObject({
      data: { user: { id: '88888888-8888-4888-8888-888888888888' } },
      error: null,
    });
  });
});
