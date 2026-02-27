import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { GET } from '@/app/api/admin/verification/linkedin/queue/route';

function buildRequest() {
  return new NextRequest('https://proofound.io/api/admin/verification/linkedin/queue', {
    method: 'GET',
  });
}

function buildSupabaseMock() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { platform_role: 'platform_admin' },
              error: null,
            }),
          }),
        }),
      };
    }),
  };
}

describe('GET /api/admin/verification/linkedin/queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('includes pending verification rows even when linkedin profile url is null', async () => {
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      buildSupabaseMock() as any
    );

    (db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                userId: 'candidate-1',
                userName: 'Candidate One',
                userEmail: null,
                userAvatar: null,
                linkedinUrl: null,
                verificationData: {
                  hasIdentityVerification: false,
                  automatedCheck: {
                    confidence: 66,
                    recommendation: 'review_manually',
                    signals: {
                      hasVerificationBadge: false,
                      connectionCount: null,
                      experienceCount: 0,
                      profileCompleteness: 0,
                      hasProfilePhoto: false,
                      accountAge: 'new',
                    },
                    sources: ['linkedin-api'],
                  },
                },
                verificationStatus: 'pending',
                linkedinVerificationStatus: 'pending',
                createdAt: new Date().toISOString(),
              },
            ]),
          }),
        }),
      }),
    });

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.queue.all).toHaveLength(1);
    expect(body.queue.all[0].linkedinUrl).toBeNull();
    expect(body.queue.all[0].linkedinVerificationLevel).toBe('pending');
    expect(body.queue.all[0].hasWorkplaceVerification).toBe(false);
    expect(body.stats.total).toBe(1);
  });
});
