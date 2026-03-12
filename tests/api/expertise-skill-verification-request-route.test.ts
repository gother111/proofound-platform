import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVerificationRequestedAsync: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  createCanonicalSkillVerificationRequest: vi.fn(),
  findExistingCanonicalSkillVerificationRequest: vi.fn(),
  listCanonicalSkillVerificationRequestsForOwner: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalSkillVerificationRequest: vi.fn(),
}));

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import {
  createCanonicalSkillVerificationRequest,
  findExistingCanonicalSkillVerificationRequest,
  listCanonicalSkillVerificationRequestsForOwner,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import { GET, POST } from '@/app/api/expertise/user-skills/[id]/verification-request/route';

const params = { params: Promise.resolve({ id: 'skill-1' }) };

function createRequest(origin: string, body: Record<string, unknown>) {
  return new NextRequest(`${origin}/api/expertise/user-skills/skill-1/verification-request`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createSupabaseMock(options?: {
  precheckResults?: Array<
    Array<{ id: string; status: 'pending' | 'accepted'; verifier_email: string }>
  >;
  requesterEmail?: string | null;
  skillRow?: Record<string, unknown>;
}) {
  let precheckCalls = 0;

  const skillsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'skill-1',
        profile_id: 'user-1',
        skill_code: null,
        skill_id: 'custom-1-2-3-system-design',
        taxonomy: null,
        ...options?.skillRow,
      },
      error: null,
    }),
  };

  const profilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        display_name: 'Alice',
      },
      error: null,
    }),
  };

  const verificationRequestsQuery = {
    select: vi.fn().mockImplementation(() => {
      const builder: any = {};
      builder.eq = vi.fn().mockImplementation(() => builder);
      builder.in = vi.fn().mockImplementation(() => {
        const resultSet =
          options?.precheckResults?.[
            Math.min(precheckCalls, Math.max((options?.precheckResults?.length || 1) - 1, 0))
          ] || [];
        precheckCalls += 1;

        return Promise.resolve({
          data: resultSet,
          error: null,
        });
      });

      return builder;
    }),
  };

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            email: options?.requesterEmail ?? 'alice@proofound.io',
          },
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'profiles') return profilesQuery;
      if (table === 'skill_verification_requests') return verificationRequestsQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase, verificationRequestsQuery, precheckCallCount: () => precheckCalls };
}

function createSupabaseGetMock(options?: {
  skillProfileId?: string;
  requests?: Array<{ status: string; integrity_status?: string | null }>;
}) {
  const skillsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: 'skill-1',
        profile_id: options?.skillProfileId ?? 'user-1',
      },
      error: null,
    }),
  };

  const verificationRequestsQuery = {
    select: vi.fn().mockImplementation(() => {
      const builder: any = {};
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.order = vi.fn().mockResolvedValue({
        data: options?.requests ?? [],
        error: null,
      });
      return builder;
    }),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'skill_verification_requests') return verificationRequestsQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase };
}

describe('POST /api/expertise/user-skills/[id]/verification-request', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  let authContext: { user: { id: string; email: string }; supabase: any };

  beforeEach(() => {
    vi.clearAllMocks();
    (findExistingCanonicalSkillVerificationRequest as any).mockResolvedValue(null);
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([]);
    (createCanonicalSkillVerificationRequest as any).mockImplementation(async (input: any) => ({
      rawToken: 'issued-token-123',
      record: {
        id: 'canonical-request-1',
        skill_id: input.skillId,
        requester_profile_id: input.ownerId,
        requester_email_snapshot: input.requesterEmailSnapshot || null,
        verifier_email: input.verifierEmail,
        verifier_source: input.verifierSource,
        verifier_relationship: input.verifierRelationship || null,
        request_kind: input.requestKind,
        attestation_request: input.attestationRequest || null,
        attestation_response: null,
        message: input.message || null,
        status: 'pending',
        created_at: '2026-03-12T10:00:00.000Z',
        responded_at: null,
        response_message: null,
        expires_at: '2026-03-26T10:00:00.000Z',
        capability_token_id: 'cap-token-123',
        email_sent: false,
        email_error: null,
        requires_authenticated_verifier: Boolean(input.requiresAuthenticatedVerifier),
        verification_kind: 'skill_attestation_peer',
        integrity_status: input.integrityStatus || 'unknown',
        integrity_reason: input.integrityReason || null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: input.riskSignals || {},
        verifier_profile_id: input.verifierProfileId || null,
        response_auth_method: null,
        response_actor_email: null,
      },
    }));
    (updateCanonicalSkillVerificationRequest as any).mockResolvedValue(null);

    const { supabase } = createSupabaseMock();
    authContext = {
      user: {
        id: 'user-1',
        email: 'alice@proofound.io',
      },
      supabase,
    };

    (requireApiAuthContext as any).mockImplementation(async () => authContext);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('normalizes verifier email and sends token link using configured site url', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-1' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.COM',
        message: 'Please verify my artifact history.',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe('canonical-request-1');
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        verifierEmail: 'mentor@example.com',
        verifierSource: 'peer',
        ownerId: 'user-1',
        requesterEmailSnapshot: 'alice@proofound.io',
      })
    );
    expect(updateCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'canonical-request-1',
        emailSent: true,
        emailError: null,
      })
    );
    expect(body.request.capability_token_id).toBe('cap-token-123');

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'mentor@example.com',
      })
    );

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://proofound.io/verify/issued-token-123');
  });

  it('marks eligible interpersonal requests as bounded attestation mode', async () => {
    const { supabase } = createSupabaseMock({
      skillRow: {
        skill_code: 'u-communication',
        skill_id: 'u-communication',
        taxonomy: {
          name_i18n: {
            en: 'Communication',
          },
        },
      },
    });
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-2' });

    const response = await POST(
      createRequest('https://proofound.io', {
        relationship: 'manager',
        verifierEmail: 'manager@example.com',
        message: 'Please describe how you observed this skill in practice.',
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        verifierEmail: 'manager@example.com',
        verifierSource: 'manager',
        verifierRelationship: 'manager',
        requestKind: 'human_observed_attestation',
        attestationRequest: expect.objectContaining({
          requestKind: 'human_observed_attestation',
          skillIds: ['skill-1'],
          skillLabels: ['Communication'],
        }),
      })
    );
  });

  it('accepts verifier emails with surrounding whitespace', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-2' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: '  Mentor@Example.COM  ',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe('canonical-request-1');
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        verifierEmail: 'mentor@example.com',
      })
    );
  });

  it('returns email_sent=false while keeping request persisted when email fails', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: false, error: 'Email service not configured' });

    const response = await POST(
      createRequest('https://staging.proofound.io', {
        verifierSource: 'manager',
        verifierEmail: 'Boss@Company.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(false);
    expect(body.request.id).toBe('canonical-request-1');
    expect(createCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        verifierEmail: 'boss@company.com',
      })
    );
    expect(updateCanonicalSkillVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'canonical-request-1',
        emailSent: false,
        emailError: 'Email service not configured',
      })
    );

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://staging.proofound.io/verify/');
  });

  it('persists the capability token reference instead of a legacy raw token column', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-capability' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Capability@Example.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe('canonical-request-1');
    expect(body.request.capability_token_id).toBe('cap-token-123');
    expect(body.request.verifier_email).toBe('capability@example.com');

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://proofound.io/verify/issued-token-123');
  });

  it('runs only the active-duplicate precheck select before creating a canonical request', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase, verificationRequestsQuery } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-no-readback' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'NoReadback@Example.COM',
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(verificationRequestsQuery.select).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when API auth context is unavailable', async () => {
    (requireApiAuthContext as any).mockResolvedValue(null);

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('blocks self verification requests by canonical email identity', async () => {
    const { supabase } = createSupabaseMock({ requesterEmail: 'alice@proofound.io' });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Alice+alias@Proofound.io',
      }),
      params
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'SELF_VERIFICATION_BLOCKED',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when a pending active duplicate exists', async () => {
    const { supabase } = createSupabaseMock({
      precheckResults: [
        [{ id: 'req-pending', status: 'pending', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-pending',
      existingStatus: 'pending',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when an accepted active duplicate exists', async () => {
    const { supabase } = createSupabaseMock({
      precheckResults: [
        [{ id: 'req-accepted', status: 'accepted', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'manager',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-accepted',
      existingStatus: 'accepted',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when the canonical create step hits a duplicate race', async () => {
    const { supabase, precheckCallCount } = createSupabaseMock({
      precheckResults: [
        [],
        [{ id: 'req-race', status: 'pending', verifier_email: 'mentor@example.com' }],
      ],
    });
    authContext.supabase = supabase;
    (createCanonicalSkillVerificationRequest as any).mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: '23505' })
    );

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      }),
      params
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-race',
      existingStatus: 'pending',
    });
    expect(precheckCallCount()).toBe(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('GET /api/expertise/user-skills/[id]/verification-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([]);
  });

  it('returns verified when at least one accepted request is integrity clear', async () => {
    const { supabase } = createSupabaseGetMock({
      requests: [
        { status: 'accepted', integrity_status: 'flagged' },
        { status: 'accepted', integrity_status: 'clear' },
      ],
    });

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/verification-request'),
      params
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'verified',
    });
  });

  it('returns pending when accepted requests are integrity flagged', async () => {
    const { supabase } = createSupabaseGetMock({
      requests: [{ status: 'accepted', integrity_status: 'flagged' }],
    });

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/verification-request'),
      params
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'pending',
    });
  });

  it('returns verified when the only accepted request is canonical and integrity clear', async () => {
    const { supabase } = createSupabaseGetMock({
      requests: [],
    });
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([
      {
        id: 'canonical-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        verifier_email: 'mentor@example.com',
        verifier_source: 'peer',
        verifier_relationship: 'peer',
        request_kind: 'generic_verification',
        attestation_request: null,
        attestation_response: null,
        message: null,
        status: 'accepted',
        created_at: '2026-03-12T10:00:00.000Z',
        responded_at: '2026-03-12T11:00:00.000Z',
        response_message: null,
        expires_at: '2026-03-26T10:00:00.000Z',
        capability_token_id: 'cap-token-123',
        email_sent: true,
        email_error: null,
        requires_authenticated_verifier: false,
        verification_kind: 'skill_attestation_peer',
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        verifier_profile_id: null,
        response_auth_method: 'authenticated',
        response_actor_email: 'mentor@example.com',
      },
    ]);

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/verification-request'),
      params
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'verified',
    });
  });
});
