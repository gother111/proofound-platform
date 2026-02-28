import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/interviews/schedule/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { isActiveOrgMember } from '@/lib/api/auth';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/db/rows', () => ({
  getRows: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  isActiveOrgMember: vi.fn(),
}));

describe('POST /api/interviews/schedule', () => {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const matchId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isActiveOrgMember).mockResolvedValue(true);
    vi.mocked(db.execute).mockResolvedValue({} as any);
    vi.mocked(getRows).mockReturnValue([
      {
        id: matchId,
        created_at: new Date().toISOString(),
        profile_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        assignment_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        role: 'Engineer',
        org_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      },
    ] as any);
  });

  function createSupabaseMock(interviewsForMatch: Array<{ id: string; status?: string | null }>) {
    const from = vi.fn((table: string) => {
      if (table === 'interviews') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({
                data: interviewsForMatch,
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({
                data: interviewsForMatch[0] ?? null,
                error: null,
              }),
            })),
          })),
        };
      }

      if (table === 'user_video_integrations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'not found' },
                }),
              }),
            })),
          })),
        };
      }

      return {
        select: vi.fn(),
      };
    });

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
        admin: {
          getUserById: vi.fn(),
        },
      },
      from,
    } as any;
  }

  it('returns already exists when an active interview is present', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock([
        { id: 'interview-scheduled', status: 'scheduled' },
        { id: 'interview-cancelled', status: 'cancelled' },
      ])
    );

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({
          matchId,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          platform: 'google_meet',
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Interview already exists for this match',
    });
  });

  it('allows re-scheduling when only cancelled interview exists', async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock([{ id: 'interview-cancelled', status: 'cancelled' }])
    );

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({
          matchId,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          platform: 'google_meet',
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain('Google Meet not connected');
  });
});
