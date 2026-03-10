import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/interviews/schedule/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { isActiveOrgMember } from '@/lib/api/auth';
import { createGoogleMeet, refreshGoogleToken } from '@/lib/integrations/google-meet';
import { postInterviewUpdateMessageBestEffort } from '@/lib/interviews/messaging';

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

vi.mock('@/lib/integrations/google-meet', () => ({
  createGoogleMeet: vi.fn(),
  refreshGoogleToken: vi.fn(),
}));

vi.mock('@/lib/interviews/messaging', () => ({
  postInterviewUpdateMessageBestEffort: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitInterviewScheduledAsync: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/workflow/service', () => ({
  registerScheduledInterviewWorkflow: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/interviews/schedule', () => {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const matchId = '11111111-1111-4111-8111-111111111111';
  const futureScheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

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
    vi.mocked(createGoogleMeet).mockResolvedValue({
      id: 'google-event-1',
      htmlLink: 'https://calendar.google.com/event?eid=test',
      hangoutLink: 'https://meet.google.com/aaa-bbbb-ccc',
      summary: 'Interview',
      start: { dateTime: futureScheduledAt, timeZone: 'UTC' },
      end: { dateTime: futureScheduledAt, timeZone: 'UTC' },
    });
    vi.mocked(refreshGoogleToken).mockResolvedValue({
      access_token: 'refreshed-access-token',
      expires_in: 3600,
    });
  });

  function createScheduleRequest(payload?: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/interviews/schedule', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        scheduledAt: futureScheduledAt,
        platform: 'google_meet',
        timezone: 'UTC',
        ...payload,
      }),
    });
  }

  function createSupabaseMock(params?: {
    interviewsForMatch?: Array<{ id: string; status?: string | null }>;
    integration?: {
      access_token: string;
      refresh_token: string;
      token_expiry: string;
    } | null;
    insertResult?: { data: any; error: any };
  }) {
    const interviewsForMatch = params?.interviewsForMatch ?? [];
    const integration = params?.integration ?? {
      access_token: 'valid-access-token',
      refresh_token: 'valid-refresh-token',
      token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    const insertResult = params?.insertResult ?? {
      data: {
        id: 'interview-1',
        match_id: matchId,
        scheduled_at: futureScheduledAt,
        meeting_link: 'https://meet.google.com/aaa-bbbb-ccc',
      },
      error: null,
    };

    const interviewsLimit = vi.fn().mockResolvedValue({
      data: interviewsForMatch,
      error: null,
    });
    const interviewsMaybeSingle = vi.fn().mockResolvedValue({
      data: interviewsForMatch[0] ?? null,
      error: null,
    });
    const interviewsEq = vi.fn().mockReturnValue({
      limit: interviewsLimit,
      maybeSingle: interviewsMaybeSingle,
    });
    const interviewsSelect = vi.fn().mockReturnValue({
      eq: interviewsEq,
    });
    const interviewsInsertSingle = vi.fn().mockResolvedValue(insertResult);
    const interviewsInsertSelect = vi.fn().mockReturnValue({
      single: interviewsInsertSingle,
    });
    const interviewsInsert = vi.fn().mockReturnValue({
      select: interviewsInsertSelect,
    });

    const integrationSingle = vi
      .fn()
      .mockResolvedValue(
        integration
          ? { data: integration, error: null }
          : { data: null, error: { message: 'not found' } }
      );
    const integrationEqProvider = vi.fn().mockReturnValue({
      single: integrationSingle,
    });
    const integrationEqUser = vi.fn().mockReturnValue({
      eq: integrationEqProvider,
    });
    const integrationSelect = vi.fn().mockReturnValue({
      eq: integrationEqUser,
    });

    const integrationUpdateEqProvider = vi.fn().mockResolvedValue({ error: null });
    const integrationUpdateEqUser = vi.fn().mockReturnValue({
      eq: integrationUpdateEqProvider,
    });
    const integrationUpdate = vi.fn().mockReturnValue({
      eq: integrationUpdateEqUser,
    });

    const integrationDeleteEqProvider = vi.fn().mockResolvedValue({ error: null });
    const integrationDeleteEqUser = vi.fn().mockReturnValue({
      eq: integrationDeleteEqProvider,
    });
    const integrationDelete = vi.fn().mockReturnValue({
      eq: integrationDeleteEqUser,
    });

    const from = vi.fn((table: string) => {
      if (table === 'interviews') {
        return {
          select: interviewsSelect,
          insert: interviewsInsert,
        };
      }

      if (table === 'user_video_integrations') {
        return {
          select: integrationSelect,
          update: integrationUpdate,
          delete: integrationDelete,
        };
      }

      return {
        select: vi.fn(),
      };
    });

    return {
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
          admin: {
            getUserById: vi.fn().mockResolvedValue({
              data: { user: { email: 'participant@example.com' } },
            }),
          },
        },
        from,
      } as any,
      spies: {
        integrationDeleteEqUser,
        integrationDeleteEqProvider,
        integrationUpdate,
        interviewsInsert,
      },
    };
  }

  it('rejects zoom scheduling while zoom is paused as coming soon', async () => {
    const { supabase } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(
      createScheduleRequest({
        platform: 'zoom',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        code: 'ZOOM_COMING_SOON',
      })
    );
  });

  it('rejects manual scheduling when manualMeetingProvider is missing', async () => {
    const { supabase } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(
      createScheduleRequest({
        platform: 'manual',
        manualMeetingLink: 'https://example.com/manual-room',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        error: 'Invalid request data',
      })
    );
    expect(JSON.stringify(payload.details)).toContain('manualMeetingProvider');
  });

  it('returns reconnect-required payload and auto-disconnects when refresh fails with invalid_grant', async () => {
    vi.mocked(refreshGoogleToken).mockRejectedValue({
      message: 'invalid_grant',
      response: {
        data: {
          error: 'invalid_grant',
          error_description: 'Token has been expired or revoked.',
        },
      },
    });

    const { supabase, spies } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
      integration: {
        access_token: 'expired-access-token',
        refresh_token: 'revoked-refresh-token',
        token_expiry: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(createScheduleRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        code: 'GOOGLE_RECONNECT_REQUIRED',
        error: 'Google authorization expired',
      })
    );
    expect(String(payload.message)).toContain('Reconnect Google Calendar');
    expect(spies.integrationDeleteEqUser).toHaveBeenCalledWith('user_id', userId);
    expect(spies.integrationDeleteEqProvider).toHaveBeenCalledWith('provider', 'google_meet');
  });

  it('returns actionable scope guidance when Google meeting creation fails due to missing scope', async () => {
    vi.mocked(createGoogleMeet).mockRejectedValue({
      message: 'Request had insufficient authentication scopes.',
      response: {
        data: {
          error: {
            message: 'Request had insufficient authentication scopes.',
            errors: [{ reason: 'insufficientPermissions' }],
          },
        },
      },
    });

    const { supabase, spies } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(createScheduleRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        code: 'GOOGLE_SCOPE_MISSING',
        error: 'Google Calendar scope missing',
      })
    );
    expect(String(payload.message)).toContain('missing required Calendar permissions');
    expect(spies.integrationDeleteEqProvider).not.toHaveBeenCalled();
  });

  it('returns verification guidance for app-not-verified signatures', async () => {
    vi.mocked(createGoogleMeet).mockRejectedValue(
      new Error('Access blocked: app not verified. Error 403: access_denied')
    );

    const { supabase } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(createScheduleRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        code: 'GOOGLE_VERIFICATION_BLOCKED',
        error: 'Google app verification required',
      })
    );
    expect(String(payload.message)).toContain('Google blocked access');
  });

  it('returns generic 500 for unknown provider exceptions', async () => {
    vi.mocked(createGoogleMeet).mockRejectedValue(new Error('Calendar socket timeout'));

    const { supabase } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(createScheduleRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to schedule interview',
    });
  });

  it('allows scheduling when only cancelled interviews exist (regression guard)', async () => {
    const { supabase, spies } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-cancelled', status: 'cancelled' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(
      createScheduleRequest({
        platform: 'manual',
        manualMeetingLink: 'https://example.com/manual-room',
        manualMeetingProvider: 'teams',
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
      })
    );
    expect(postInterviewUpdateMessageBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'scheduled',
      })
    );
    expect(spies.interviewsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        manual_meeting_provider: 'teams',
      })
    );
  });

  it('allows recovery scheduling after a recorded no-show by creating a new interview', async () => {
    const { supabase } = createSupabaseMock({
      interviewsForMatch: [{ id: 'interview-no-show', status: 'no_show' }],
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const response = await POST(
      createScheduleRequest({
        platform: 'manual',
        manualMeetingLink: 'https://example.com/manual-room',
        manualMeetingProvider: 'google_meet',
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        success: true,
      })
    );
  });
});
