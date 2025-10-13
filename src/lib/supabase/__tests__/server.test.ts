import { describe, expect, beforeEach, afterEach, it, vi, type Mock } from 'vitest';

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
  let createServerClient: Mock;
  let cookies: Mock;

  beforeEach(async () => {
    process.env = { ...envBackup };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    vi.resetModules();
    ({ createServerClient } = await import('@supabase/ssr'));
    ({ cookies } = await import('next/headers'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('passes cookie helpers that merge default options', async () => {
    const getMock = vi.fn(() => ({ value: 'cookie-value' }));
    const setMock = vi.fn();

    cookies.mockResolvedValue({
      get: getMock,
      set: setMock,
    });

    const { createClient } = await import('../server');
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    );

    const [, , config] = createServerClient.mock.calls[0];
    const cookieConfig = config.cookies;

    expect(cookieConfig.get('sb-access-token')).toBe('cookie-value');

    cookieConfig.set('sb-access-token', 'value', {});
    expect(setMock).toHaveBeenCalledWith('sb-access-token', 'value', {
      path: '/',
      sameSite: 'lax',
    });

    cookieConfig.remove('sb-refresh-token', {});
    expect(setMock).toHaveBeenCalledWith('sb-refresh-token', '', {
      path: '/',
      sameSite: 'lax',
      maxAge: 0,
      expires: expect.any(Date),
    });
  });

  it('logs a warning when cookie store is read-only', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    cookies.mockResolvedValue({
      get: vi.fn(),
    });

    const { createClient } = await import('../server');
    await createClient();

    const [, , config] = createServerClient.mock.calls[0];
    const cookieConfig = config.cookies;

    cookieConfig.set('name', 'value', {});
    cookieConfig.remove('name', {});

    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });

  it('falls back to server-only env vars when NEXT_PUBLIC values are empty', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_URL = 'https://server-only.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'server-only-anon';

    cookies.mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
    });

    const { createClient } = await import('../server');
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'https://server-only.supabase.co',
      'server-only-anon',
      expect.any(Object)
    );
  });
});
