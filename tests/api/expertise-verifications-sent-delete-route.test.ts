import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/verification/integrity', () => ({
  writeVerificationAuditLog: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import { DELETE } from '@/app/api/expertise/verifications/sent/[requestType]/[requestId]/route';

function makeDeleteBuilder(result: unknown) {
  const builder: any = {
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
  };
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

function makeRequest(requestType: string, requestId: string) {
  return {
    request: new NextRequest(
      `http://localhost/api/expertise/verifications/sent/${requestType}/${requestId}`,
      {
        method: 'DELETE',
      }
    ),
    params: Promise.resolve({ requestType, requestId }),
  };
}

describe('DELETE /api/expertise/verifications/sent/[requestType]/[requestId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    } as any);
  });

  it('deletes requester-owned pending skill verification requests', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-1',
              requester_profile_id: 'user-1',
              status: 'pending',
              custom_request_id: null,
              skill_id: 'skill-1',
              verifier_email: 'mentor@example.com',
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-1');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'skill',
      requestId: 'req-skill-1',
    });
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion when requester does not own the skill request', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-2',
              requester_profile_id: 'someone-else',
              status: 'pending',
              custom_request_id: null,
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-2');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(403);
    expect(skillTable.delete).not.toHaveBeenCalled();
    expect(writeVerificationAuditLog).not.toHaveBeenCalled();
  });

  it('rejects deletion for disallowed skill statuses', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-3',
              requester_profile_id: 'user-1',
              status: 'accepted',
              custom_request_id: null,
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-3');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(400);
    expect(skillTable.delete).not.toHaveBeenCalled();
  });

  it('returns bundled-request conflict for skill requests linked to a custom bundle', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-4',
              requester_profile_id: 'user-1',
              status: 'pending',
              custom_request_id: 'bundle-1',
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-4');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'BUNDLED_REQUEST',
      customRequestId: 'bundle-1',
    });
    expect(skillTable.delete).not.toHaveBeenCalled();
  });

  it('deletes requester-owned failed impact verification requests', async () => {
    const impactTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-impact-1',
              requester_profile_id: 'user-1',
              status: 'failed',
              impact_story_id: 'story-1',
              verifier_email: 'reviewer@example.com',
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'impact_story_verification_requests') return impactTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('impact_story', 'req-impact-1');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'impact_story',
      requestId: 'req-impact-1',
    });
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });
});
