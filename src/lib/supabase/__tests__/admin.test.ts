import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createSupabaseClientMock } = vi.hoisted(() => ({
  createSupabaseClientMock: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createSupabaseClientMock,
}));

describe('createAdminClient', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
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

  it('creates a real admin client when service role credentials are present', async () => {
    const { createAdminClient } = await import('../admin');

    createAdminClient();

    expect(createSupabaseClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  });

  it('fails closed when the production service role key is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const { createAdminClient } = await import('../admin');

    expect(() => createAdminClient()).toThrow(/Missing SUPABASE env for admin client/);
    expect(createSupabaseClientMock).not.toHaveBeenCalled();
  });

  it('rejects mock admin clients in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createAdminClient } = await import('../admin');

    expect(() => createAdminClient()).toThrow(/NEXT_PUBLIC_USE_MOCK_SUPABASE/);
    expect(createSupabaseClientMock).not.toHaveBeenCalled();
  });

  it('keeps the mock admin client available outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    const { createAdminClient } = await import('../admin');
    const adminClient = createAdminClient();

    await expect(adminClient.auth.admin.createUser()).resolves.toMatchObject({
      data: { user: { id: 'mock-user-id' } },
      error: null,
    });
    expect(createSupabaseClientMock).not.toHaveBeenCalled();
  });
});
