import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
  resolveUserHomePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock('@/lib/auth', () => ({
  resolveUserHomePath: mocks.resolveUserHomePath,
}));

vi.mock('@/lib/debug-ingest', () => ({
  sendDebugIngest: vi.fn(),
}));

vi.mock('@/components/auth/SignIn', () => ({
  SignIn: () => null,
}));

import LoginPage from '@/app/(auth)/login/page';

describe('login next redirect sanitizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to the home path for backslash network-path redirects', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mocks.resolveUserHomePath.mockResolvedValue('/app/i/home');

    await LoginPage({
      searchParams: Promise.resolve({ next: '/\\\\attacker.example/phish' }),
    });

    expect(mocks.redirect).toHaveBeenCalledWith('/app/i/home');
  });

  it('preserves safe internal next paths for authenticated users', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mocks.resolveUserHomePath.mockResolvedValue('/app/i/home');

    await LoginPage({
      searchParams: Promise.resolve({ next: '/app/i/verifications' }),
    });

    expect(mocks.redirect).toHaveBeenCalledWith('/app/i/verifications');
  });
});
