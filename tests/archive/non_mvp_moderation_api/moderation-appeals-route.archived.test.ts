import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST } from '@/app/api/moderation/appeals/route';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const ACTION_ID = '22222222-2222-2222-2222-222222222222';
const REPORT_ID = '33333333-3333-3333-3333-333333333333';
const APPEAL_ID = '44444444-4444-4444-4444-444444444444';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/moderation/appeals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

function mockUserAuth(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId ? { id: userId } : null,
        },
        error: null,
      }),
    },
  };
}

type AppealsFixture = {
  moderationAction: Record<string, unknown> | null;
  moderationActionError: any;
  report: Record<string, unknown> | null;
  reportError: any;
  existingAppeal: Record<string, unknown> | null;
  createdAppeal: Record<string, unknown> | null;
  createAppealError: any;
};

function buildAdminClient(overrides: Partial<AppealsFixture> = {}) {
  const fixture: AppealsFixture = {
    moderationAction: {
      id: ACTION_ID,
      report_id: REPORT_ID,
      is_appealable: true,
      appeal_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    moderationActionError: null,
    report: {
      id: REPORT_ID,
      reporter_id: USER_ID,
      content_owner_id: '99999999-9999-9999-9999-999999999999',
    },
    reportError: null,
    existingAppeal: null,
    createdAppeal: {
      id: APPEAL_ID,
      status: 'submitted',
      created_at: new Date().toISOString(),
    },
    createAppealError: null,
    ...overrides,
  };

  const insertSpy = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: fixture.createdAppeal,
        error: fixture.createAppealError,
      }),
    }),
  });

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'moderation_actions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: fixture.moderationAction,
                error: fixture.moderationActionError,
              }),
            }),
          }),
        };
      }

      if (table === 'content_reports') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: fixture.report,
                error: fixture.reportError,
              }),
            }),
          }),
        };
      }

      if (table === 'moderation_appeals') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: fixture.existingAppeal,
                  error: null,
                }),
              }),
            }),
          }),
          insert: insertSpy,
        };
      }

      return {};
    }),
  };

  return { client, insertSpy };
}

describe('POST /api/moderation/appeals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockUserAuth(USER_ID) as any);
    const { client } = buildAdminClient();
    vi.mocked(createAdminClient).mockReturnValue(client as any);
  });

  it('returns 401 when caller is unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(mockUserAuth(null) as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      buildRequest({
        moderationActionId: 'bad-id',
        appealReason: 'short',
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 404 when moderation action is not found', async () => {
    const { client } = buildAdminClient({
      moderationAction: null,
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(404);
  });

  it('returns 403 when user is not eligible to appeal', async () => {
    const { client } = buildAdminClient({
      report: {
        id: REPORT_ID,
        reporter_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        content_owner_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      },
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 when moderation action is not appealable', async () => {
    const { client } = buildAdminClient({
      moderationAction: {
        id: ACTION_ID,
        report_id: REPORT_ID,
        is_appealable: false,
        appeal_deadline: null,
      },
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 409 when duplicate appeal exists', async () => {
    const { client } = buildAdminClient({
      existingAppeal: { id: APPEAL_ID },
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(409);
  });

  it('returns 410 when appeal deadline has passed', async () => {
    const { client } = buildAdminClient({
      moderationAction: {
        id: ACTION_ID,
        report_id: REPORT_ID,
        is_appealable: true,
        appeal_deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(410);
  });

  it('returns 404 when report is not found', async () => {
    const { client } = buildAdminClient({
      report: null,
      reportError: null,
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );

    expect(response.status).toBe(404);
  });

  it('creates appeal successfully when eligible', async () => {
    const { client, insertSpy } = buildAdminClient();
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        appealReason: 'Please review this moderation action again.',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.appeal.id).toBe(APPEAL_ID);
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        moderation_action_id: ACTION_ID,
        report_id: REPORT_ID,
        appellant_id: USER_ID,
      })
    );
  });
});
