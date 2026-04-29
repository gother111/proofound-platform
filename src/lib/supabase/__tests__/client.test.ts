import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(() => ({ auth: {} })),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}));

describe('browser Supabase client mock guard', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'false';

    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...envBackup };
  });

  it('rejects the public mock Supabase flag in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createClient } = await import('../client');

    expect(() => createClient()).toThrow(/NEXT_PUBLIC_USE_MOCK_SUPABASE/);
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });

  it('keeps browser mock Supabase available outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createClient } = await import('../client');
    const client = createClient();

    await expect(client.auth.getUser()).resolves.toMatchObject({
      data: { user: { id: '88888888-8888-4888-8888-888888888888' } },
      error: null,
    });
    expect(createBrowserClientMock).not.toHaveBeenCalled();
  });
});
