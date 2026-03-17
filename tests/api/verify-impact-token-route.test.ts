import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const sendEmailMock = vi.fn();
const beginCapabilityTokenRedeemSessionMock = vi.fn();
const redeemCapabilityTokenMock = vi.fn();
const listCanonicalSkillProofRowsForOwnerSkillMock = vi.fn();
const getCanonicalSkillVerificationRequestByTokenMock = vi.fn();
const updateCanonicalSkillVerificationRequestMock = vi.fn();
const getCanonicalImpactVerificationRequestByTokenMock = vi.fn();
const updateCanonicalImpactVerificationRequestMock = vi.fn();
const emitVerificationProvidedMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: (...args: any[]) => sendEmailMock(...args),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
    IMPACT_VERIFICATION_RESPONSE: 'impact_verification_response',
  },
  getCapabilityRedeemSessionCookieName: (tokenClass: string) => `pf_cap_${tokenClass}`,
  beginCapabilityTokenRedeemSession: (...args: any[]) =>
    beginCapabilityTokenRedeemSessionMock(...args),
  redeemCapabilityToken: (...args: any[]) => redeemCapabilityTokenMock(...args),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalSkillProofRowsForOwnerSkill: (...args: any[]) =>
    listCanonicalSkillProofRowsForOwnerSkillMock(...args),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  getCanonicalSkillVerificationRequestByToken: (...args: any[]) =>
    getCanonicalSkillVerificationRequestByTokenMock(...args),
  updateCanonicalSkillVerificationRequest: (...args: any[]) =>
    updateCanonicalSkillVerificationRequestMock(...args),
}));

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  getCanonicalImpactVerificationRequestByToken: (...args: any[]) =>
    getCanonicalImpactVerificationRequestByTokenMock(...args),
  updateCanonicalImpactVerificationRequest: (...args: any[]) =>
    updateCanonicalImpactVerificationRequestMock(...args),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitVerificationProvided: (...args: any[]) => emitVerificationProvidedMock(...args),
}));

import { GET, POST } from '@/app/api/verify/[token]/route';

const TOKEN = 'a'.repeat(64);

function createClientWithAuth(user: { id?: string; email?: string } | null = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
        error: null,
      }),
    },
    from: vi.fn(() => {
      throw new Error('request-scoped Supabase client tables should not be used in this test');
    }),
  };
}

function createAdminClient(options?: {
  requesterProfile?: Record<string, unknown> | null;
  impactStory?: Record<string, unknown> | null;
  skillLookup?: Record<string, unknown> | null;
  skillStrength?: string;
  onImpactStoryUpdate?: (payload: Record<string, unknown>) => void;
  onSkillUpdate?: (payload: Record<string, unknown>) => void;
}) {
  const requesterProfile = options?.requesterProfile ?? {
    email: 'requester@example.com',
    display_name: 'Requester Person',
    avatar_url: null,
  };
  const impactStory = options?.impactStory ?? {
    id: 'story-1',
    title: 'Impact Story',
    user_id: 'story-owner-1',
    role_title: 'Program Lead',
    affiliation_details: 'Voice of Ukrainians in Sweden',
    org_description: 'Community organization',
    measured_outcomes: [{ id: 'outcome-1', change: 'People supported', value: 42, unit: 'people' }],
    supporting_artifacts: [{ id: 'artifact-1', title: 'Proof' }],
  };
  const skillLookup = options?.skillLookup ?? {
    skill_id: 'custom-1-2-3-system-design',
    skill_code: null,
    custom_skill_name: null,
    taxonomy: {
      name_i18n: {
        en: 'System Design',
      },
    },
  };

  return {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn((_: string, value: string) => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  value === 'requester-1' || value === 'user-1' || value === 'story-owner-1'
                    ? requesterProfile
                    : null,
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data:
                  value === 'requester-1' || value === 'user-1' || value === 'story-owner-1'
                    ? requesterProfile
                    : null,
                error: null,
              }),
            })),
          }),
        };
      }

      if (table === 'impact_stories') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: impactStory, error: null }),
            }),
          }),
          update: vi.fn((payload: Record<string, unknown>) => {
            options?.onImpactStoryUpdate?.(payload);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'skills') {
        return {
          select: vi.fn((query: string) => ({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: query.includes('evidence_strength')
                  ? { evidence_strength: options?.skillStrength ?? '0.2' }
                  : skillLookup,
                error: null,
              }),
            }),
          })),
          update: vi.fn((payload: Record<string, unknown>) => {
            options?.onSkillUpdate?.(payload);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'audit_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('verify token route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendEmailMock.mockResolvedValue(undefined);
    redeemCapabilityTokenMock.mockResolvedValue({ ok: true });
    emitVerificationProvidedMock.mockResolvedValue(undefined);
    listCanonicalSkillProofRowsForOwnerSkillMock.mockResolvedValue([]);
  });

  it('GET returns impact-story payload from canonical verification transport', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    beginCapabilityTokenRedeemSessionMock.mockImplementation(
      async (_token: string, options: { tokenClass: string }) =>
        options.tokenClass === 'impact_verification_response'
          ? { ok: true, redeemSessionNonce: 'impact-nonce', maxAgeSeconds: 600 }
          : { ok: false, reason: 'unused' }
    );
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'impact-request-1',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_name: 'Verifier Name',
        verifier_relationship: 'Program Director',
        message: 'Please verify the impact claims.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        claim_snapshot: {},
        created_at: '2026-02-20T00:00:00.000Z',
        expires_at: '2099-02-20T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'impact-request-1',
      },
      error: null,
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification.verification_type).toBe('impact_story');
    expect(body.verification.requester_name).toBe('Requester Person');
    expect(body.verification.why_you_are_receiving_this).toContain('Requester Person asked you');
    expect(body.verification.claims.roleClaim.id).toBe('role');
  });

  it('POST impact requests require authenticated verifier consent when flagged for auth', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'impact-request-1',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_name: 'Verifier Name',
        verifier_relationship: 'Program Director',
        message: 'Please verify the impact claims.',
        status: 'pending',
        requires_authenticated_verifier: true,
        integrity_status: 'warning',
        integrity_reason: 'manual_review',
        integrity_meta: {},
        integrity_flagged_at: '2026-02-20T00:00:00.000Z',
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        claim_snapshot: {},
        created_at: '2026-02-20T00:00:00.000Z',
        expires_at: '2099-02-20T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'impact-request-1',
      },
      error: null,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept', confirmedClaimIds: ['role'] }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe('AUTH_REQUIRED');
    expect(updateCanonicalImpactVerificationRequestMock).not.toHaveBeenCalled();
  });

  it('POST updates canonical impact verification requests for matching authenticated verifiers', async () => {
    let impactStoryUpdatePayload: Record<string, unknown> | null = null;

    createClientMock.mockReturnValue(
      createClientWithAuth({
        id: 'verifier-user-1',
        email: 'verifier@example.com',
      })
    );
    createAdminClientMock.mockReturnValue(
      createAdminClient({
        onImpactStoryUpdate: (payload) => {
          impactStoryUpdatePayload = payload;
        },
      })
    );
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'impact-request-1',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_name: 'Verifier Name',
        verifier_relationship: 'Program Director',
        message: 'Please verify the impact claims.',
        status: 'pending',
        requires_authenticated_verifier: true,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        claim_snapshot: {},
        verifier_profile_id: null,
        created_at: '2026-02-20T00:00:00.000Z',
        expires_at: '2099-02-20T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'impact-request-1',
      },
      error: null,
    });
    updateCanonicalImpactVerificationRequestMock.mockImplementation(
      async (payload: Record<string, unknown>) => ({
        id: 'impact-request-1',
        ...payload,
      })
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        headers: {
          cookie: 'pf_cap_impact_verification_response=impact-nonce',
        },
        body: JSON.stringify({ action: 'accept', confirmedClaimIds: ['role', 'artifacts'] }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification_type).toBe('impact_story');
    expect(body.status).toBe('accepted');
    expect(updateCanonicalImpactVerificationRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'impact-request-1',
        status: 'accepted',
        responseAuthMethod: 'authenticated',
        responseActorEmail: 'verifier@example.com',
      })
    );
    expect(impactStoryUpdatePayload).toMatchObject({ verified: true });
  });

  it('GET returns skill verification payload from canonical verification transport', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    beginCapabilityTokenRedeemSessionMock.mockImplementation(
      async (_token: string, options: { tokenClass: string }) =>
        options.tokenClass === 'skill_verification_response'
          ? { ok: true, redeemSessionNonce: 'skill-nonce', maxAgeSeconds: 600 }
          : { ok: false, reason: 'unused' }
    );
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'skill-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_source: 'peer',
        verifier_relationship: 'Peer reviewer',
        verifier_profile_id: null,
        request_kind: 'generic_verification',
        attestation_request: null,
        attestation_response: null,
        message: 'Please verify this skill.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        created_at: '2026-02-24T00:00:00.000Z',
        expires_at: '2099-02-24T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'skill-request-1',
      },
      error: null,
    });
    listCanonicalSkillProofRowsForOwnerSkillMock.mockResolvedValue([
      {
        id: 'proof-1',
        proof_type: 'link',
        title: 'Architecture writeup',
        description: 'Proof of work',
        url: 'https://example.com/proof',
        file_path: null,
        issued_date: '2026-02-01',
        expires_date: null,
      },
    ]);

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.skill_name).toBe('System Design');
    expect(body.verification.requester_name).toBe('Requester Person');
    expect(body.verification.proofs).toHaveLength(1);
  });

  it('POST updates canonical skill verification requests', async () => {
    let skillUpdatePayload: Record<string, unknown> | null = null;

    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(
      createAdminClient({
        onSkillUpdate: (payload) => {
          skillUpdatePayload = payload;
        },
      })
    );
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'skill-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_source: 'peer',
        verifier_relationship: 'Peer reviewer',
        verifier_profile_id: null,
        request_kind: 'generic_verification',
        attestation_request: null,
        attestation_response: null,
        message: 'Please verify this skill.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        created_at: '2026-02-24T00:00:00.000Z',
        expires_at: '2099-02-24T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'skill-request-1',
        skills: {
          taxonomy: {
            name_i18n: {
              en: 'System Design',
            },
          },
        },
      },
      error: null,
    });
    updateCanonicalSkillVerificationRequestMock.mockImplementation(
      async (payload: Record<string, unknown>) => ({
        id: 'skill-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_source: 'peer',
        verifier_relationship: 'Peer reviewer',
        verifier_profile_id: null,
        request_kind: 'generic_verification',
        attestation_request: null,
        attestation_response: payload.attestationResponse ?? null,
        message: 'Please verify this skill.',
        status: payload.status,
        requires_authenticated_verifier: false,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        created_at: '2026-02-24T00:00:00.000Z',
        responded_at: payload.respondedAt,
        response_message: payload.responseMessage,
        expires_at: '2099-02-24T00:00:00.000Z',
        skills: {
          taxonomy: {
            name_i18n: {
              en: 'System Design',
            },
          },
        },
      })
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        headers: {
          cookie: 'pf_cap_skill_verification_response=skill-nonce',
        },
        body: JSON.stringify({ action: 'accept', message: 'Confirmed.' }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.canonical_record_id).toBe('skill-request-1');
    expect(updateCanonicalSkillVerificationRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'skill-request-1',
        status: 'accepted',
        responseAuthMethod: 'token',
      })
    );
    expect(skillUpdatePayload).toMatchObject({
      evidence_strength: expect.any(String),
    });
  });

  it('POST requires structured attestation fields for human-observed skill requests', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'skill-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_source: 'manager',
        verifier_relationship: 'Manager',
        verifier_profile_id: null,
        request_kind: 'human_observed_attestation',
        attestation_request: {
          requestKind: 'human_observed_attestation',
          skillIds: ['skill-1'],
          skillLabels: ['System Design'],
          skillFamilies: ['delivery'],
        },
        attestation_response: null,
        message: 'Please record what you observed.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'clear',
        integrity_reason: null,
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        created_at: '2026-02-24T00:00:00.000Z',
        expires_at: '2099-02-24T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'skill-request-1',
      },
      error: null,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(updateCanonicalSkillVerificationRequestMock).not.toHaveBeenCalled();
  });

  it('GET returns 410 for expired canonical skill tokens', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    beginCapabilityTokenRedeemSessionMock.mockResolvedValue({
      ok: false,
      reason: 'unused',
    });
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: null,
      error: 'expired',
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toBe('Verification request has expired');
  });

  it('POST returns 404 for revoked canonical skill tokens', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: null,
      error: 'revoked',
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Verification request not found or invalid token');
    expect(updateCanonicalSkillVerificationRequestMock).not.toHaveBeenCalled();
  });

  it('GET fails shut for contradicted canonical impact requests', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    beginCapabilityTokenRedeemSessionMock.mockImplementation(
      async (_token: string, options: { tokenClass: string }) =>
        options.tokenClass === 'impact_verification_response'
          ? { ok: true, redeemSessionNonce: 'impact-nonce', maxAgeSeconds: 600 }
          : { ok: false, reason: 'unused' }
    );
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'impact-request-1',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_name: 'Verifier Name',
        verifier_relationship: 'Program Director',
        message: 'Please verify the impact claims.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'contradicted',
        integrity_reason: 'documented_contradiction',
        dispute_state: 'none',
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        contradicted_at: '2026-02-20T00:00:00.000Z',
        revoked_at: null,
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        claim_snapshot: {},
        created_at: '2026-02-20T00:00:00.000Z',
        expires_at: '2099-02-20T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'impact-request-1',
      },
      error: null,
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Verification request not found or invalid token');
  });

  it('POST fails shut for contradicted canonical skill requests', async () => {
    createClientMock.mockReturnValue(createClientWithAuth(null));
    createAdminClientMock.mockReturnValue(createAdminClient());
    getCanonicalImpactVerificationRequestByTokenMock.mockResolvedValue({ data: null, error: null });
    getCanonicalSkillVerificationRequestByTokenMock.mockResolvedValue({
      data: {
        id: 'skill-request-1',
        skill_id: 'skill-1',
        requester_profile_id: 'user-1',
        requester_email_snapshot: 'requester@example.com',
        verifier_email: 'verifier@example.com',
        verifier_source: 'peer',
        verifier_relationship: 'Peer reviewer',
        verifier_profile_id: null,
        request_kind: 'generic_verification',
        attestation_request: null,
        attestation_response: null,
        message: 'Please verify this skill.',
        status: 'pending',
        requires_authenticated_verifier: false,
        integrity_status: 'contradicted',
        integrity_reason: 'documented_contradiction',
        dispute_state: 'none',
        integrity_meta: {},
        integrity_flagged_at: null,
        risk_signals: {},
        contradicted_at: '2026-02-24T00:00:00.000Z',
        revoked_at: null,
        requester_ip_hash: null,
        requester_user_agent_hash: null,
        created_at: '2026-02-24T00:00:00.000Z',
        expires_at: '2099-02-24T00:00:00.000Z',
        source_request_table: 'verification_records',
        source_request_id: 'skill-request-1',
      },
      error: null,
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'accept' }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Verification request not found or invalid token');
    expect(updateCanonicalSkillVerificationRequestMock).not.toHaveBeenCalled();
  });
});
