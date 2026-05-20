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
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = {
      getAll: vi.fn(() => [{ name: 'sb-session', value: 'token' }]),
      set: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' https://example.supabase.co ';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ' anon-key ';

    const { createClient } = await import('../server');
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );

    const cookieAdapter = vi.mocked(createServerClient).mock.calls[0]?.[2]?.cookies;
    expect(cookieAdapter?.getAll()).toEqual([{ name: 'sb-session', value: 'token' }]);

    (cookieAdapter as any)?.setAll([
      { name: 'sb-session', value: 'new-token', options: { path: '/' } },
    ]);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('writes refreshed auth cookies only when explicitly allowed', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    const { createClient } = await import('../server');
    await createClient({ allowCookieWrite: true });

    const cookieAdapter = vi.mocked(createServerClient).mock.calls[0]?.[2]?.cookies;
    (cookieAdapter as any)?.setAll([
      { name: 'sb-session', value: 'new-token', options: { path: '/' } },
    ]);

    expect(cookieStore.set).toHaveBeenCalledWith('sb-session', 'new-token', { path: '/' });
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
