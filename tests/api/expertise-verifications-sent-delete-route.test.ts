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
  normalizeEmail: (value: string | null | undefined) => (value ? value.trim().toLowerCase() : null),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sender';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import {
  DELETE,
  POST,
} from '@/app/api/expertise/verifications/sent/[requestType]/[requestId]/route';

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
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
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

  it('resends pending skill verification requests without cloning', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-resend-pending',
              skill_id: 'skill-1',
              requester_profile_id: 'user-1',
              verifier_email: 'mentor@example.com',
              verifier_source: 'peer',
              message: 'Please verify',
              custom_request_id: null,
              status: 'pending',
              verification_token: 'existing-token',
            },
            error: null,
          }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    const profilesTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { display_name: 'Requester Name' },
            error: null,
          }),
        })),
      })),
    };

    const skillsTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              skill_id: 'custom-1-2-3-typescript',
              name_i18n: { en: 'TypeScript' },
              taxonomy: null,
            },
            error: null,
          }),
        })),
      })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        if (table === 'profiles') return profilesTable as any;
        if (table === 'skills') return skillsTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-resend-pending');
    const response = await POST(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      reusedRecord: true,
      requestType: 'skill',
    });
    expect(skillTable.insert).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('resends declined skill verification requests by cloning a new pending request', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-skill-resend-declined',
              skill_id: 'skill-2',
              requester_profile_id: 'user-1',
              verifier_email: 'reviewer@example.com',
              verifier_source: 'manager',
              message: 'Please review',
              custom_request_id: null,
              status: 'declined',
              verification_token: 'old-token',
            },
            error: null,
          }),
        })),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    const profilesTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { display_name: 'Requester Name' },
            error: null,
          }),
        })),
      })),
    };

    const skillsTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              skill_id: 'custom-1-2-3-leadership',
              name_i18n: { en: 'Leadership' },
              taxonomy: null,
            },
            error: null,
          }),
        })),
      })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'skill_verification_requests') return skillTable as any;
        if (table === 'profiles') return profilesTable as any;
        if (table === 'skills') return skillsTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'req-skill-resend-declined');
    const response = await POST(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      reusedRecord: false,
      requestType: 'skill',
    });
    expect(skillTable.insert).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('resends pending impact verification requests without cloning', async () => {
    const impactUpdateBuilder = makeDeleteBuilder({ error: null });
    const impactTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'req-impact-resend-pending',
              requester_profile_id: 'user-1',
              status: 'pending',
              impact_story_id: 'story-1',
              verifier_email: 'reviewer@example.com',
              token: 'impact-token',
              message: 'Please verify',
            },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => impactUpdateBuilder),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => makeDeleteBuilder({ error: null })),
    };

    const profilesTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { display_name: 'Requester Name' },
            error: null,
          }),
        })),
      })),
    };

    const storiesTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { title: 'Impact Story Title' },
            error: null,
          }),
        })),
      })),
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'impact_story_verification_requests') return impactTable as any;
        if (table === 'profiles') return profilesTable as any;
        if (table === 'impact_stories') return storiesTable as any;
        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('impact_story', 'req-impact-resend-pending');
    const response = await POST(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      reusedRecord: true,
      requestType: 'impact_story',
    });
    expect(impactTable.insert).not.toHaveBeenCalled();
    expect(impactTable.update).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });
});
