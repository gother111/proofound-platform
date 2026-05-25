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

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { emitVerificationRequestedAsync } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import {
  createCanonicalSkillVerificationRequest,
  findExistingCanonicalSkillVerificationRequest,
  listCanonicalSkillVerificationRequestsForOwner,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import { GET, POST } from '@/app/api/verification/requests/skill/route';

function createRequest(origin: string, body: Record<string, unknown>) {
  return new NextRequest(`${origin}/api/verification/requests/skill`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      skillId: 'skill-1',
      ...body,
    }),
  });
}

function createRawRequest(origin: string, body: string) {
  return new NextRequest(`${origin}/api/verification/requests/skill`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
  });
}

function createSupabaseMock(options?: {
  requesterEmail?: string | null;
  skillRow?: Record<string, unknown>;
}) {
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
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase };
}

function createSupabaseGetMock(options?: { skillProfileId?: string }) {
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

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      throw new Error(`Unexpected table ${table}`);
    }),
  };

  return { supabase };
}

describe('POST /api/verification/requests/skill', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalMockSupabase = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
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
    process.env.VERCEL_ENV = originalVercelEnv;
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = originalMockSupabase;
  });

  it('normalizes verifier email and sends token link using the configured canonical site url', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-1' });

    const response = await POST(
      createRequest('https://attacker.example', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.COM',
        message: 'Please verify my artifact history.',
      })
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
    expect(sentEmailPayload.subject).toBe('Proofound verification request');
    expect(sentEmailPayload.html).toContain('https://proofound.io/verify/issued-token-123');
    expect(sentEmailPayload.html).not.toContain('https://attacker.example/verify/issued-token-123');
    expect(sentEmailPayload.html).not.toContain('Alice');
    expect(sentEmailPayload.html).not.toContain('system design');
    expect(sentEmailPayload.html).not.toContain('Please verify my artifact history.');
  });

  it('does not let local mock mode bypass skill ownership validation', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock({
      skillRow: {
        id: '33333333-3333-4333-8333-333333333333',
        profile_id: 'other-user',
      },
    });
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://proofound.io', {
        skillId: '33333333-3333-4333-8333-333333333333',
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Skill not found' });
    expect(createCanonicalSkillVerificationRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('fails closed when no canonical site url is configured in a production-like runtime', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_APP_URL = '';
    process.env.VERCEL_ENV = 'preview';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;

    const response = await POST(
      createRequest('https://attacker.example', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Verification request email configuration is unavailable.',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before skill lookup or request creation', async () => {
    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;

    const response = await POST(createRawRequest('https://proofound.io', '{"skillId":'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(createCanonicalSkillVerificationRequest).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
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
      })
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
      })
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
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: false, error: 'Email service not configured' });

    const response = await POST(
      createRequest('https://attacker.example', {
        verifierSource: 'manager',
        verifierEmail: 'Boss@Company.COM',
      })
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
    expect(log.warn).toHaveBeenCalledWith('verification.skill_request.email_send_failed', {
      requestId: 'canonical-request-1',
      error: 'Email service not configured',
    });

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://staging.proofound.io/verify/');
    expect(sentEmailPayload.text).not.toContain('Boss@Company.COM');
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
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.email_sent).toBe(true);
    expect(body.request.id).toBe('canonical-request-1');
    expect(body.request.capability_token_id).toBe('cap-token-123');
    expect(body.request.verifier_email).toBe('capability@example.com');

    const sentEmailPayload = (sendEmail as any).mock.calls[0][0];
    expect(sentEmailPayload.html).toContain('https://proofound.io/verify/issued-token-123');
    expect(sentEmailPayload.subject).toBe('Proofound verification request');
  });

  it('runs only the active-duplicate precheck select before creating a canonical request', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-no-readback' });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'NoReadback@Example.COM',
      })
    );

    expect(response.status).toBe(201);
    expect(findExistingCanonicalSkillVerificationRequest).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when API auth context is unavailable', async () => {
    (requireApiAuthContext as any).mockResolvedValue(null);

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
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
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'SELF_VERIFICATION_BLOCKED',
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 409 when a pending active duplicate exists', async () => {
    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (findExistingCanonicalSkillVerificationRequest as any).mockResolvedValueOnce({
      id: 'req-pending',
      skill_id: 'skill-1',
      requester_profile_id: 'user-1',
      verifier_email: 'mentor@example.com',
      status: 'pending',
      created_at: '2026-03-12T10:00:00.000Z',
    });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'Mentor@Example.com',
      })
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
    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (findExistingCanonicalSkillVerificationRequest as any).mockResolvedValueOnce({
      id: 'req-accepted',
      skill_id: 'skill-1',
      requester_profile_id: 'user-1',
      verifier_email: 'mentor@example.com',
      status: 'accepted',
      created_at: '2026-03-12T10:00:00.000Z',
    });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'manager',
        verifierEmail: 'mentor@example.com',
      })
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
    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (findExistingCanonicalSkillVerificationRequest as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'req-race',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        verifier_email: 'mentor@example.com',
        status: 'pending',
        created_at: '2026-03-12T10:00:00.000Z',
      });
    (createCanonicalSkillVerificationRequest as any).mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: '23505' })
    );

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DUPLICATE_VERIFICATION_REQUEST',
      existingRequestId: 'req-race',
      existingStatus: 'pending',
    });
    expect(log.error).toHaveBeenCalledWith('verification.skill_request.create_failed', {
      skillId: 'skill-1',
      error: 'duplicate key',
    });
    expect(findExistingCanonicalSkillVerificationRequest).toHaveBeenCalledTimes(2);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('logs email state persistence failures without failing the request', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-state-fail' });
    (updateCanonicalSkillVerificationRequest as any).mockRejectedValueOnce(
      new Error('email state update failed')
    );

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
    );

    expect(response.status).toBe(201);
    expect(log.error).toHaveBeenCalledWith(
      'verification.skill_request.email_state_persist_failed',
      {
        requestId: 'canonical-request-1',
        error: 'email state update failed',
      }
    );
  });

  it('logs analytics failures without failing the request', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.NEXT_PUBLIC_APP_URL = '';

    const { supabase } = createSupabaseMock();
    authContext.supabase = supabase;
    (sendEmail as any).mockResolvedValue({ success: true, id: 'email-analytics-fail' });
    (emitVerificationRequestedAsync as any).mockImplementationOnce(() => {
      throw new Error('analytics unavailable');
    });

    const response = await POST(
      createRequest('https://proofound.io', {
        verifierSource: 'peer',
        verifierEmail: 'mentor@example.com',
      })
    );

    expect(response.status).toBe(201);
    expect(log.error).toHaveBeenCalledWith('verification.skill_request.analytics_emit_failed', {
      requestId: 'canonical-request-1',
      error: 'analytics unavailable',
    });
  });
});

describe('GET /api/verification/requests/skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([]);
  });

  it('returns verified when at least one accepted request is integrity clear', async () => {
    const { supabase } = createSupabaseGetMock();
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([
      { status: 'accepted', integrity_status: 'flagged', skill_id: 'skill-1' },
      { status: 'accepted', integrity_status: 'clear', skill_id: 'skill-1' },
    ]);

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/verification/requests/skill?skillId=skill-1')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'verified',
    });
  });

  it('returns pending when accepted requests are integrity flagged', async () => {
    const { supabase } = createSupabaseGetMock();
    (listCanonicalSkillVerificationRequestsForOwner as any).mockResolvedValue([
      { status: 'accepted', integrity_status: 'flagged', skill_id: 'skill-1' },
    ]);

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/verification/requests/skill?skillId=skill-1')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'pending',
    });
  });

  it('returns verified when the only accepted request is canonical and integrity clear', async () => {
    const { supabase } = createSupabaseGetMock();
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
      new NextRequest('http://localhost/api/verification/requests/skill?skillId=skill-1')
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      verification_status: 'verified',
    });
  });

  it('logs unexpected GET failures structurally while keeping the public response generic', async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error('skill lookup failed');
      }),
    };
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/verification/requests/skill?skillId=skill-1')
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
    expect(log.error).toHaveBeenCalledWith('verification.skill_request.get_failed', {
      error: 'skill lookup failed',
    });
  });
});
