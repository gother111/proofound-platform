import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as linkedinAuthGet } from '@/app/api/auth/linkedin/route';
import { GET as linkedinCallbackGet } from '@/app/api/auth/linkedin/callback/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: null,
      })),
    },
  })),
}));

describe('LinkedIn OAuth redirects', () => {
  it('GET /api/auth/linkedin redirects unauthenticated users to /login', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('/login?error=unauthorized');
  });

  it('GET /api/auth/linkedin/callback redirects state mismatch to /app/i/settings (not /settings)', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin/callback?code=abc&state=bad', {
      headers: {
        cookie: 'linkedin_oauth_state=good; linkedin_oauth_user=user_123',
      },
    });
    const res = await linkedinCallbackGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('/app/i/settings?');
    // Ensure we did not redirect to the old non-existent /settings route.
    expect(location).not.toMatch(/\/\/[^/]+\/settings\?/);
  });
});
