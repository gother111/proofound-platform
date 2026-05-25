import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
  })),
}));

import { createMockServerClient } from '@/lib/supabase/mock-server-client';

describe('mock Supabase server client OAuth', () => {
  it.each(['google', 'linkedin_oidc'] as const)(
    'returns a deterministic local authorize URL for %s',
    async (provider) => {
      const supabase = createMockServerClient();

      const result = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'http://localhost:33180/auth/callback?next=%2Fapp%2Fi%2Fverifications',
        },
      });

      expect(result.error).toBeNull();
      expect(result.data.url).toContain('http://localhost:33180/auth/v1/authorize');
      expect(result.data.url).toContain(`provider=${provider}`);
      expect(result.data.url).toContain('redirect_to=');
    }
  );

  it('returns an auth-style error for unsupported providers', async () => {
    const supabase = createMockServerClient();

    const result = await supabase.auth.signInWithOAuth({
      provider: 'github' as never,
    });

    expect(result.data.url).toBeNull();
    expect(result.error?.message).toBe('Unsupported OAuth provider');
  });
});
