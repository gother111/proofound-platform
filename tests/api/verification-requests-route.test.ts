import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/verification/request-feed', () => ({
  loadVerificationRequestFeed: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { loadVerificationRequestFeed } from '@/lib/verification/request-feed';
import { GET } from '@/app/api/verification/requests/route';

describe('GET /api/verification/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized without loading the verification request feed', async () => {
    vi.mocked(requireApiAuthContext).mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/verification/requests'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(loadVerificationRequestFeed).not.toHaveBeenCalled();
  });

  it('loads the verification request feed with normalized auth context', async () => {
    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: 'USER@EXAMPLE.COM',
              email_confirmed_at: '2026-05-21T07:30:00.000Z',
            },
          },
        }),
      },
    };
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    } as any);
    vi.mocked(loadVerificationRequestFeed).mockResolvedValue({
      incoming: [],
      sent: [],
      composerProofPacks: [],
    } as any);

    const response = await GET(new NextRequest('http://localhost/api/verification/requests'));

    expect(response.status).toBe(200);
    expect(loadVerificationRequestFeed).toHaveBeenCalledWith({
      userId: 'user-1',
      userEmail: 'user@example.com',
      hasVerifiedEmail: true,
      supabase,
    });
  });

  it('logs verification request feed failures without exposing the auth email', async () => {
    const feedError = new Error('feed unavailable');
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                email: 'user@example.com',
                email_confirmed_at: null,
              },
            },
          }),
        },
      },
    } as any);
    vi.mocked(loadVerificationRequestFeed).mockRejectedValue(feedError);

    const response = await GET(new NextRequest('http://localhost/api/verification/requests'));

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.requests.get_failed', {
      error: feedError,
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('user@example.com');
  });
});
