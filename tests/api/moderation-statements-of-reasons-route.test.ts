import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: vi.fn(),
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

import { POST } from '@/app/api/moderation/statements-of-reasons/route';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

const ACTION_ID = '22222222-2222-2222-2222-222222222222';
const REPORT_ID = '33333333-3333-3333-3333-333333333333';
const ADMIN_ID = '11111111-1111-1111-1111-111111111111';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/moderation/statements-of-reasons', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

function buildAdminClient(
  overrides: {
    moderationAction?: Record<string, unknown> | null;
    moderationActionError?: any;
    report?: Record<string, unknown> | null;
    reportError?: any;
    statement?: Record<string, unknown> | null;
    saveError?: any;
  } = {}
) {
  const config = {
    moderationAction: {
      id: ACTION_ID,
      report_id: REPORT_ID,
      is_appealable: true,
      appeal_deadline: null,
    },
    moderationActionError: null,
    report: {
      id: REPORT_ID,
      content_owner_id: '99999999-9999-9999-9999-999999999999',
    },
    reportError: null,
    statement: {
      id: '55555555-5555-5555-5555-555555555555',
      moderation_action_id: ACTION_ID,
    },
    saveError: null,
    ...overrides,
  };

  const upsertSpy = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: config.statement,
        error: config.saveError,
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
                data: config.moderationAction,
                error: config.moderationActionError,
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
                data: config.report,
                error: config.reportError,
              }),
            }),
          }),
        };
      }

      if (table === 'moderation_statements_of_reasons') {
        return {
          upsert: upsertSpy,
        };
      }

      return {};
    }),
  };

  return { client, upsertSpy };
}

describe('POST /api/moderation/statements-of-reasons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlatformAdminJson).mockResolvedValue({
      adminLevel: 'platform_admin',
      userId: ADMIN_ID,
      email: 'admin@example.com',
      platformRole: 'platform_admin',
    });
    const { client } = buildAdminClient();
    vi.mocked(createAdminClient).mockReturnValue(client as any);
  });

  it('returns guard response when caller is not admin', async () => {
    vi.mocked(requirePlatformAdminJson).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        reasonSummary: 'Reason',
        legalBasis: 'Terms',
        evidenceSummary: 'Evidence',
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        reasonSummary: 'bad',
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 404 when moderation action does not exist', async () => {
    const { client } = buildAdminClient({
      moderationAction: null,
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        reasonSummary: 'Valid reason summary',
        legalBasis: 'Terms of Service',
        evidenceSummary: 'Evidence summary',
      })
    );

    expect(response.status).toBe(404);
  });

  it('returns 404 when report does not exist', async () => {
    const { client } = buildAdminClient({
      report: null,
    });
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        reasonSummary: 'Valid reason summary',
        legalBasis: 'Terms of Service',
        evidenceSummary: 'Evidence summary',
      })
    );

    expect(response.status).toBe(404);
  });

  it('upserts statement of reasons successfully', async () => {
    const { client, upsertSpy } = buildAdminClient();
    vi.mocked(createAdminClient).mockReturnValue(client as any);

    const response = await POST(
      buildRequest({
        moderationActionId: ACTION_ID,
        reasonSummary: 'Valid reason summary',
        legalBasis: 'Terms of Service',
        evidenceSummary: 'Evidence summary',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.statement.moderation_action_id).toBe(ACTION_ID);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        moderation_action_id: ACTION_ID,
        report_id: REPORT_ID,
        generated_by: ADMIN_ID,
      }),
      { onConflict: 'moderation_action_id' }
    );
  });
});
