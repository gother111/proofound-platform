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

vi.mock('@/lib/verification/canonical-requests', () => ({
  createCanonicalSkillVerificationRequest: vi.fn(),
  getCanonicalSkillVerificationRequestById: vi.fn(),
  listCanonicalSkillVerificationRequestsForOwner: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalSkillVerificationRequest: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  createCanonicalImpactVerificationRequest: vi.fn(),
  getCanonicalImpactVerificationRequestById: vi.fn(),
  mapCanonicalImpactVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalImpactVerificationRequest: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-bundles', () => ({
  getCanonicalBundleById: vi.fn(),
  resendCanonicalBundle: vi.fn(),
  updateCanonicalBundleDeliveryState: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sender';
import { writeVerificationAuditLog } from '@/lib/verification/integrity';
import {
  createCanonicalSkillVerificationRequest,
  getCanonicalSkillVerificationRequestById,
  listCanonicalSkillVerificationRequestsForOwner,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import {
  createCanonicalImpactVerificationRequest,
  getCanonicalImpactVerificationRequestById,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import {
  DELETE as deleteSkillRoute,
  POST as postSkillRoute,
} from '@/app/api/verification/requests/skill/[requestId]/route';
import {
  DELETE as deleteImpactRoute,
  POST as postImpactRoute,
} from '@/app/api/verification/requests/impact-story/[requestId]/route';

function makeRequest(requestType: string, requestId: string) {
  return {
    request: new NextRequest(
      `http://localhost/api/verification/requests/${requestType === 'skill' ? 'skill' : 'impact-story'}/${requestId}`,
      {
        method: 'DELETE',
      }
    ),
    params: Promise.resolve({ requestType, requestId }),
  };
}

async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string; requestId: string }> }
) {
  const resolved = await params;
  if (resolved.requestType === 'skill') {
    return postSkillRoute(request, { params: Promise.resolve({ requestId: resolved.requestId }) });
  }

  return postImpactRoute(request, { params: Promise.resolve({ requestId: resolved.requestId }) });
}

async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string; requestId: string }> }
) {
  const resolved = await params;
  if (resolved.requestType === 'skill') {
    return deleteSkillRoute(request, {
      params: Promise.resolve({ requestId: resolved.requestId }),
    });
  }

  return deleteImpactRoute(request, {
    params: Promise.resolve({ requestId: resolved.requestId }),
  });
}

function makeCanonicalSkillRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    skill_id: 'skill-1',
    requester_profile_id: 'user-1',
    requester_email_snapshot: 'requester@example.com',
    verifier_email: 'mentor@example.com',
    verifier_source: 'peer',
    verifier_relationship: null,
    verifier_profile_id: null,
    request_kind: 'generic_verification',
    attestation_request: null,
    message: 'Please verify',
    custom_request_id: null,
    status: 'pending',
    capability_token_id: 'old-capability-token-id',
    requires_authenticated_verifier: false,
    integrity_status: 'clear',
    integrity_reason: null,
    integrity_meta: {},
    integrity_flagged_at: null,
    risk_signals: {},
    expires_at: '2099-03-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCanonicalImpactRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    impact_story_id: 'story-1',
    requester_profile_id: 'user-1',
    requester_email_snapshot: 'requester@example.com',
    verifier_email: 'reviewer@example.com',
    verifier_name: 'Reviewer Name',
    verifier_relationship: 'Client',
    verifier_profile_id: null,
    message: 'Please verify',
    claim_snapshot: {},
    status: 'pending',
    capability_token_id: 'old-impact-capability-token-id',
    requires_authenticated_verifier: false,
    integrity_status: 'clear',
    integrity_reason: null,
    risk_signals: {},
    expires_at: '2099-03-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('sent verification request delete and resend routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    } as any);
    vi.mocked(sendEmail).mockResolvedValue({ success: true });
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(null as any);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);
    vi.mocked(updateCanonicalSkillVerificationRequest).mockResolvedValue({} as any);
    vi.mocked(createCanonicalSkillVerificationRequest).mockResolvedValue({
      record: { id: 'generated-request-id' },
      rawToken: 'capability-token',
    } as any);
    vi.mocked(getCanonicalImpactVerificationRequestById).mockResolvedValue(null as any);
    vi.mocked(updateCanonicalImpactVerificationRequest).mockResolvedValue({} as any);
    vi.mocked(createCanonicalImpactVerificationRequest).mockResolvedValue({
      record: { id: 'generated-request-id' },
      rawToken: 'capability-token',
    } as any);
  });

  it('deletes requester-owned pending skill verification requests', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest()
    );

    const { request, params } = makeRequest('skill', '11111111-1111-4111-8111-111111111111');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'skill',
      requestId: '11111111-1111-4111-8111-111111111111',
    });
    expect(updateCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: '11111111-1111-4111-8111-111111111111',
        status: 'cancelled',
      })
    );
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects deletion when requester does not own the skill request', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '22222222-2222-4222-8222-222222222222',
        requester_profile_id: 'someone-else',
      })
    );

    const { request, params } = makeRequest('skill', '22222222-2222-4222-8222-222222222222');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(403);
    expect(writeVerificationAuditLog).not.toHaveBeenCalled();
  });

  it('rejects deletion for disallowed skill statuses', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '33333333-3333-4333-8333-333333333333',
        status: 'accepted',
      })
    );

    const { request, params } = makeRequest('skill', '33333333-3333-4333-8333-333333333333');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(400);
  });

  it('returns bundled-request conflict for skill requests linked to a custom bundle', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '44444444-4444-4444-8444-444444444444',
        custom_request_id: 'bundle-1',
      })
    );

    const { request, params } = makeRequest('skill', '44444444-4444-4444-8444-444444444444');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'BUNDLED_REQUEST',
      customRequestId: 'bundle-1',
    });
  });

  it('logs skill cancellation failures with structured diagnostics', async () => {
    const cancelError = new Error('skill cancel failed');
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '44444444-4444-4444-9444-444444444444',
        skill_id: 'skill-failed-cancel',
      })
    );
    vi.mocked(updateCanonicalSkillVerificationRequest).mockRejectedValueOnce(cancelError);

    const { request, params } = makeRequest('skill', '44444444-4444-4444-9444-444444444444');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.sent_requests.skill_cancel_failed', {
      error: cancelError,
      userId: 'user-1',
      requestId: '44444444-4444-4444-9444-444444444444',
      skillId: 'skill-failed-cancel',
    });
  });

  it('deletes requester-owned failed impact verification requests', async () => {
    vi.mocked(getCanonicalImpactVerificationRequestById).mockResolvedValue(
      makeCanonicalImpactRequest({
        status: 'failed',
      })
    );

    const { request, params } = makeRequest('impact_story', '55555555-5555-4555-8555-555555555555');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      requestType: 'impact_story',
      requestId: '55555555-5555-4555-8555-555555555555',
    });
    expect(updateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: '55555555-5555-4555-8555-555555555555',
        status: 'cancelled',
      })
    );
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('logs impact cancellation failures with structured diagnostics', async () => {
    const cancelError = new Error('impact cancel failed');
    vi.mocked(getCanonicalImpactVerificationRequestById).mockResolvedValue(
      makeCanonicalImpactRequest({
        id: '55555555-5555-4555-9555-555555555555',
        impact_story_id: 'story-failed-cancel',
      })
    );
    vi.mocked(updateCanonicalImpactVerificationRequest).mockRejectedValueOnce(cancelError);

    const { request, params } = makeRequest('impact_story', '55555555-5555-4555-9555-555555555555');
    const response = await DELETE(request, { params });

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.sent_requests.impact_cancel_failed', {
      error: cancelError,
      userId: 'user-1',
      requestId: '55555555-5555-4555-9555-555555555555',
      impactStoryId: 'story-failed-cancel',
    });
  });

  it('resends pending skill verification requests without cloning', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '66666666-6666-4666-8666-666666666666',
      })
    );

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
    expect(updateCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: '66666666-6666-4666-8666-666666666666',
        status: 'pending',
        capabilityTokenId: 'capability-token-id',
      })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('logs requester and skill name lookup fallbacks during skill resend', async () => {
    const requesterError = new Error('profile lookup failed');
    const skillError = new Error('skill lookup failed');
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '99999999-9999-4999-9999-999999999999',
        skill_id: 'skill-lookup-fallback',
      })
    );

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: requesterError,
                }),
              })),
            })),
          } as any;
        }

        if (table === 'skills') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: skillError,
                }),
              })),
            })),
          } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', '99999999-9999-4999-9999-999999999999');
    const response = await POST(request, { params });

    expect(response.status).toBe(200);
    expect(log.warn).toHaveBeenCalledWith(
      'verification.sent_requests.requester_name_lookup_failed',
      {
        error: requesterError,
        userId: 'user-1',
      }
    );
    expect(log.warn).toHaveBeenCalledWith('verification.sent_requests.skill_name_lookup_failed', {
      error: skillError,
      skillId: 'skill-lookup-fallback',
    });
    expect(JSON.stringify(vi.mocked(log.warn).mock.calls)).not.toContain('mentor@example.com');
  });

  it('resends declined skill verification requests by cloning a new pending request', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '77777777-7777-4777-8777-777777777777',
        skill_id: 'skill-2',
        verifier_email: 'reviewer@example.com',
        verifier_source: 'manager',
        message: 'Please review',
        status: 'declined',
      })
    );

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
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-1',
        skillId: 'skill-2',
        verifierEmail: 'reviewer@example.com',
      })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('regenerates expired skill verification requests by cloning a fresh pending request', async () => {
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: '88888888-8888-4888-8888-888888888888',
        skill_id: 'skill-3',
        verifier_email: 'reviewer@example.com',
        message: 'Please review again',
        status: 'expired',
      })
    );

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
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-1',
        skillId: 'skill-3',
        verifierEmail: 'reviewer@example.com',
      })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('logs skill resend clone failures with structured diagnostics', async () => {
    const cloneError = new Error('skill clone failed');
    vi.mocked(getCanonicalSkillVerificationRequestById).mockResolvedValue(
      makeCanonicalSkillRequest({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        skill_id: 'skill-clone-failed',
        verifier_email: 'reviewer@example.com',
        status: 'declined',
      })
    );
    vi.mocked(createCanonicalSkillVerificationRequest).mockRejectedValueOnce(cloneError);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'Requester Name' },
                  error: null,
                }),
              })),
            })),
          } as any;
        }

        if (table === 'skills') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    skill_id: 'custom-1-2-3-review',
                    name_i18n: { en: 'Review' },
                    taxonomy: null,
                  },
                  error: null,
                }),
              })),
            })),
          } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('skill', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    const response = await POST(request, { params });

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.sent_requests.skill_clone_failed', {
      error: cloneError,
      userId: 'user-1',
      sourceRequestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      skillId: 'skill-clone-failed',
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('reviewer@example.com');
  });

  it('resends pending impact verification requests without cloning', async () => {
    vi.mocked(getCanonicalImpactVerificationRequestById).mockResolvedValue(
      makeCanonicalImpactRequest({
        id: '99999999-9999-4999-8999-999999999999',
      })
    );

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
    expect(updateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: '99999999-9999-4999-8999-999999999999',
        status: 'pending',
        capabilityTokenId: 'capability-token-id',
      })
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(writeVerificationAuditLog).toHaveBeenCalledTimes(1);
  });

  it('logs impact resend clone failures with structured diagnostics', async () => {
    const cloneError = new Error('impact clone failed');
    vi.mocked(getCanonicalImpactVerificationRequestById).mockResolvedValue(
      makeCanonicalImpactRequest({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        impact_story_id: 'story-clone-failed',
        verifier_email: 'reviewer@example.com',
        status: 'declined',
      })
    );
    vi.mocked(createCanonicalImpactVerificationRequest).mockRejectedValueOnce(cloneError);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { display_name: 'Requester Name' },
                  error: null,
                }),
              })),
            })),
          } as any;
        }

        if (table === 'impact_stories') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { title: 'Impact Story Title' },
                  error: null,
                }),
              })),
            })),
          } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any);

    const { request, params } = makeRequest('impact_story', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    const response = await POST(request, { params });

    expect(response.status).toBe(500);
    expect(log.error).toHaveBeenCalledWith('verification.sent_requests.impact_clone_failed', {
      error: cloneError,
      userId: 'user-1',
      sourceRequestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      impactStoryId: 'story-clone-failed',
    });
    expect(JSON.stringify(vi.mocked(log.error).mock.calls)).not.toContain('reviewer@example.com');
  });
});
