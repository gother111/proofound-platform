import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { exchangeCodeForSessionMock, createClientMock, resolveUserHomePathMock } = vi.hoisted(
  () => ({
    exchangeCodeForSessionMock: vi.fn(),
    createClientMock: vi.fn(),
    resolveUserHomePathMock: vi.fn(),
  })
);

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/auth', () => ({
  resolveUserHomePath: resolveUserHomePathMock,
}));

import { GET } from '@/app/auth/callback/route';

describe('auth callback route', () => {
  const mockSupabase = {
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue(mockSupabase);
    resolveUserHomePathMock.mockResolvedValue('/app/i/home');
  });

  it('redirects email verification token links to verify-email with type=email', async () => {
    const req = new NextRequest('http://localhost/auth/callback?type=email&token_hash=email-token');
    const res = await GET(req);

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const url = new URL(location!);
    expect(url.pathname).toBe('/verify-email');
    expect(url.searchParams.get('token')).toBe('email-token');
    expect(url.searchParams.get('type')).toBe('email');
  });

  it('redirects signup verification token links to verify-email with type=signup', async () => {
    const req = new NextRequest(
      'http://localhost/auth/callback?type=signup&token_hash=signup-token'
    );
    const res = await GET(req);

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const url = new URL(location!);
    expect(url.pathname).toBe('/verify-email');
    expect(url.searchParams.get('token')).toBe('signup-token');
    expect(url.searchParams.get('type')).toBe('signup');
  });

  it('handles recovery callbacks without forwarding code to confirm page', async () => {
    const req = new NextRequest(
      'http://localhost/auth/callback?type=recovery&code=recovery-code&token_hash=recovery-token'
    );
    const res = await GET(req);

    expect(exchangeCodeForSessionMock).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('recovery-code');
    expect(resolveUserHomePathMock).not.toHaveBeenCalled();

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/reset-password/confirm');
    expect(url.searchParams.get('token_hash')).toBe('recovery-token');
    expect(url.searchParams.get('token')).toBe('recovery-token');
    expect(url.searchParams.get('code')).toBeNull();
  });

  it('exchanges oauth code and redirects authenticated users to their home path', async () => {
    const req = new NextRequest('http://localhost/auth/callback?code=oauth-code');
    const res = await GET(req);

    expect(exchangeCodeForSessionMock).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('oauth-code');
    expect(resolveUserHomePathMock).toHaveBeenCalledTimes(1);
    expect(resolveUserHomePathMock).toHaveBeenCalledWith(mockSupabase);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/app/i/home');
  });
});
