import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/interviews/edit/route';
import { createClient } from '@/lib/supabase/server';
import {
  canManageInterviewAsOrgAdmin,
  postInterviewUpdateMessageBestEffort,
} from '@/lib/interviews/messaging';
import { buildWorkflowView, recordInterviewRescheduleAudit } from '@/lib/workflow/service';
import { log } from '@/lib/log';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/interviews/messaging', () => ({
  canManageInterviewAsOrgAdmin: vi.fn(),
  postInterviewUpdateMessageBestEffort: vi.fn(),
}));

vi.mock('@/lib/workflow/service', () => ({
  recordInterviewRescheduleAudit: vi.fn().mockResolvedValue(undefined),
  buildWorkflowView: vi.fn().mockReturnValue({
    state: 'scheduled',
    displayState: 'Scheduled',
    reasonCode: 'rescheduled_by_org',
    timestamps: {},
    allowedActions: [],
  }),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

describe('POST /api/interviews/edit', () => {
  const interviewId = '11111111-1111-4111-8111-111111111111';
  const orgAdminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not org owner/admin', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        rescheduleCount: 0,
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
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
      new NextRequest('http://localhost/api/interviews/edit', {
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
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId: 'not-a-uuid',
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(log.error).toHaveBeenCalledWith('interviews.edit.failed', {
      error: expect.objectContaining({ name: 'ZodError' }),
    });
    expect(canManageInterviewAsOrgAdmin).not.toHaveBeenCalled();
  });

  it('returns 400 when interview is not scheduled', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: updateEq }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        status: 'completed',
        scheduledAt: new Date(Date.now() + 30 * 60 * 1000),
        platform: 'manual',
        meetingUrl: 'https://example.com/manual-room',
        timezone: 'UTC',
        rescheduleCount: 0,
      },
    } as any);

    const response = await POST(
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('updates interview and emits interview edit message', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const from = vi.fn().mockReturnValue({
      update,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        platform: 'google_meet',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        timezone: 'UTC',
        rescheduleCount: 0,
      },
    } as any);

    const nextScheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const response = await POST(
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          scheduledAt: nextScheduledAt,
          timezone: 'Europe/Stockholm',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalled();
    expect(updateEq).toHaveBeenCalledWith('id', interviewId);
    expect(recordInterviewRescheduleAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId,
        reasonCode: 'rescheduled_by_org',
        nextTimezone: 'Europe/Stockholm',
      })
    );
    expect(buildWorkflowView).toHaveBeenCalledWith(
      expect.objectContaining({
        machine: 'interview',
        state: 'scheduled',
      })
    );
    expect(postInterviewUpdateMessageBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'edited',
        interviewId,
      })
    );
  });

  it('blocks edits after the single allowed reschedule has been used', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const from = vi.fn().mockReturnValue({
      update,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
        platform: 'google_meet',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        timezone: 'UTC',
        rescheduleCount: 1,
      },
    } as any);

    const nextScheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const response = await POST(
      new NextRequest('http://localhost/api/interviews/edit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          scheduledAt: nextScheduledAt,
          timezone: 'Europe/Stockholm',
        }),
      })
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Maximum 1 reschedule');
    expect(update).not.toHaveBeenCalled();
    expect(recordInterviewRescheduleAudit).not.toHaveBeenCalled();
  });
});
