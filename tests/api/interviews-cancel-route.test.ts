import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/interviews/cancel/route';
import { createClient } from '@/lib/supabase/server';
import {
  canManageInterviewAsOrgAdmin,
  postInterviewUpdateMessageBestEffort,
} from '@/lib/interviews/messaging';
import { log } from '@/lib/log';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/interviews/messaging', () => ({
  canManageInterviewAsOrgAdmin: vi.fn(),
  postInterviewUpdateMessageBestEffort: vi.fn(),
}));

vi.mock('@/lib/workflow/service', () => ({
  recordInterviewTransition: vi.fn().mockResolvedValue({
    status: 'cancelled',
    cancelReason: 'cancelled_by_org',
    completedAt: null,
    cancelledAt: new Date(),
    noShowAt: null,
    updatedAt: new Date(),
  }),
  buildWorkflowView: vi.fn().mockReturnValue({
    state: 'cancelled',
    displayState: 'Cancelled',
    reasonCode: 'cancelled_by_org',
    timestamps: {},
    allowedActions: [],
  }),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('POST /api/interviews/cancel', () => {
  const interviewId = '11111111-1111-4111-8111-111111111111';
  const orgAdminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when user is not org owner/admin', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: orgAdminId } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any);

    vi.mocked(canManageInterviewAsOrgAdmin).mockResolvedValue({
      allowed: false,
      context: {
        interviewId,
        matchId: '22222222-2222-4222-8222-222222222222',
        orgId: '33333333-3333-4333-8333-333333333333',
        candidateId: '44444444-4444-4444-8444-444444444444',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        timezone: 'UTC',
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/cancel', {
        method: 'POST',
        body: JSON.stringify({ interviewId }),
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 for malformed JSON before interview authorization lookup', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: orgAdminId } },
          error: null,
        }),
      },
      from: vi.fn(),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/cancel', {
        method: 'POST',
        body: '{',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(canManageInterviewAsOrgAdmin).not.toHaveBeenCalled();
  });

  it('logs validation failures with structured diagnostics', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: orgAdminId } },
          error: null,
        }),
      },
      from: vi.fn(),
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/cancel', {
        method: 'POST',
        body: JSON.stringify({ interviewId: 'not-a-uuid' }),
      })
    );

    expect(response.status).toBe(400);
    expect(log.error).toHaveBeenCalledWith('interviews.cancel.failed', {
      error: expect.objectContaining({ name: 'ZodError' }),
    });
    expect(canManageInterviewAsOrgAdmin).not.toHaveBeenCalled();
  });

  it('returns 400 when interview is not scheduled', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: orgAdminId } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any);

    vi.mocked(canManageInterviewAsOrgAdmin).mockResolvedValue({
      allowed: true,
      context: {
        interviewId,
        matchId: '22222222-2222-4222-8222-222222222222',
        orgId: '33333333-3333-4333-8333-333333333333',
        candidateId: '44444444-4444-4444-8444-444444444444',
        status: 'completed',
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        timezone: 'UTC',
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/cancel', {
        method: 'POST',
        body: JSON.stringify({ interviewId }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('cancels interview and emits interview cancel message', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const from = vi.fn().mockReturnValue({
      update,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { notes: '' }, error: null }),
        }),
      }),
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: orgAdminId } },
          error: null,
        }),
      },
      from,
    } as any);

    vi.mocked(canManageInterviewAsOrgAdmin).mockResolvedValue({
      allowed: true,
      context: {
        interviewId,
        matchId: '22222222-2222-4222-8222-222222222222',
        orgId: '33333333-3333-4333-8333-333333333333',
        candidateId: '44444444-4444-4444-8444-444444444444',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        timezone: 'UTC',
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/cancel', {
        method: 'POST',
        body: JSON.stringify({ interviewId }),
      })
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalled();
    expect(updateEq).toHaveBeenCalledWith('id', interviewId);
    expect(postInterviewUpdateMessageBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cancelled',
        interviewId,
      })
    );
  });
});
