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

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
    EMAIL_THEN_PROFILE_LOCK: 'email_then_profile_lock',
  },
  CAPABILITY_TOKEN_CLASSES: {
    SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
    IMPACT_VERIFICATION_RESPONSE: 'impact_verification_response',
    CUSTOM_VERIFICATION_RESPONSE: 'custom_verification_response',
  },
  issueCapabilityToken: vi.fn(async () => ({
    rawToken: 'capability-token',
    tokenHash: 'capability-token-hash',
    token: { id: 'capability-token-id', source_id: 'generated-request-id' },
  })),
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
              id: '11111111-1111-4111-8111-111111111111',
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

    const { request, params } = makeRequest('skill', '11111111-1111-4111-8111-111111111111');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'skill',
      requestId: '11111111-1111-4111-8111-111111111111',
    });
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion when requester does not own the skill request', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '22222222-2222-4222-8222-222222222222',
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

    const { request, params } = makeRequest('skill', '22222222-2222-4222-8222-222222222222');
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
              id: '33333333-3333-4333-8333-333333333333',
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

    const { request, params } = makeRequest('skill', '33333333-3333-4333-8333-333333333333');
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
              id: '44444444-4444-4444-8444-444444444444',
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

    const { request, params } = makeRequest('skill', '44444444-4444-4444-8444-444444444444');
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
              id: '55555555-5555-4555-8555-555555555555',
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

    const { request, params } = makeRequest('impact_story', '55555555-5555-4555-8555-555555555555');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'impact_story',
      requestId: '55555555-5555-4555-8555-555555555555',
    });
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('resends pending skill verification requests without cloning', async () => {
    const skillUpdateBuilder = makeDeleteBuilder({ error: null });
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '66666666-6666-4666-8666-666666666666',
              skill_id: 'skill-1',
              requester_profile_id: 'user-1',
              verifier_email: 'mentor@example.com',
              verifier_source: 'peer',
              message: 'Please verify',
              custom_request_id: null,
              status: 'pending',
              capability_token_id: 'old-capability-token-id',
            },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => skillUpdateBuilder),
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

    const { request, params } = makeRequest('skill', '66666666-6666-4666-8666-666666666666');
    const response = await POST(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      reusedRecord: true,
      requestType: 'skill',
    });
    expect(skillTable.insert).not.toHaveBeenCalled();
    expect(skillTable.update).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('resends declined skill verification requests by cloning a new pending request', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '77777777-7777-4777-8777-777777777777',
              skill_id: 'skill-2',
              requester_profile_id: 'user-1',
              verifier_email: 'reviewer@example.com',
              verifier_source: 'manager',
              message: 'Please review',
              custom_request_id: null,
              status: 'declined',
              capability_token_id: 'old-capability-token-id',
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

    const { request, params } = makeRequest('skill', '77777777-7777-4777-8777-777777777777');
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

  it('regenerates expired skill verification requests by cloning a fresh pending request', async () => {
    const skillTable = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: '88888888-8888-4888-8888-888888888888',
              skill_id: 'skill-3',
              requester_profile_id: 'user-1',
              verifier_email: 'reviewer@example.com',
              verifier_source: 'peer',
              message: 'Please review again',
              custom_request_id: null,
              status: 'expired',
              capability_token_id: 'old-capability-token-id',
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
              skill_id: 'custom-1-2-3-systems-thinking',
              name_i18n: { en: 'Systems Thinking' },
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

    const { request, params } = makeRequest('skill', '88888888-8888-4888-8888-888888888888');
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
              id: '99999999-9999-4999-8999-999999999999',
              requester_profile_id: 'user-1',
              status: 'pending',
              impact_story_id: 'story-1',
              verifier_email: 'reviewer@example.com',
              capability_token_id: 'old-impact-capability-token-id',
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

    const { request, params } = makeRequest('impact_story', '99999999-9999-4999-8999-999999999999');
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
