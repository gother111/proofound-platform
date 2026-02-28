import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/verify/[token]/route';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createClientMock(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: (...args: any[]) => sendEmailMock(...args),
}));

const TOKEN = 'a'.repeat(64);
const LEGACY_REQUEST_ID = '123e4567-e89b-42d3-a456-426614174000';
const SKILL_VERIFICATION_RECORD = {
  id: 'skill-req-1',
  skill_id: 'skill-1',
  requester_profile_id: 'user-1',
  verifier_email: 'verifier@example.com',
  verifier_source: 'peer',
  verifier_profile_id: null,
  message: 'Please verify this skill',
  status: 'pending',
  requires_authenticated_verifier: false,
  integrity_status: 'clear',
  integrity_reason: null,
  integrity_meta: {},
  integrity_flagged_at: null,
  risk_signals: {},
  requester_ip_hash: null,
  requester_user_agent_hash: null,
  response_message: null,
  responded_at: null,
  created_at: '2026-02-24T00:00:00.000Z',
  expires_at: '2099-02-24T00:00:00.000Z',
  skills: {
    skill_id: 'custom-1-2-3-system-design',
    skill_code: null,
    custom_skill_name: null,
    taxonomy: {
      name_i18n: {
        en: 'System Design',
      },
    },
  },
};

const SKILL_RELATION_AMBIGUITY_ERROR = {
  code: 'PGRST201',
  message:
    "Could not embed because more than one relationship was found for 'skill_verification_requests' and 'skills'",
  details: [
    {
      cardinality: 'many-to-one',
      embedding: 'skill_verification_requests with skills',
      relationship: 'skill_verification_requests_skill_id_fkey',
    },
    {
      cardinality: 'many-to-one',
      embedding: 'skill_verification_requests with skills',
      relationship: 'skill_verification_requests_skill_id_skills_id_fk',
    },
  ],
};

function buildImpactAdminClient(overrides?: {
  impactRequest?: any;
  impactStory?: any;
  requesterProfile?: any;
  storyOwnerProfile?: any;
  onImpactStoryUpdate?: (payload: any) => void;
  onImpactRequestUpdate?: (payload: any) => void;
}) {
  const impactRequest = overrides?.impactRequest || {
    id: 'req-1',
    impact_story_id: 'story-1',
    requester_profile_id: 'requester-1',
    verifier_email: 'verifier@example.com',
    verifier_name: 'Verifier',
    verifier_relationship: 'Program Director',
    message: 'Please verify claims',
    status: 'pending',
    requires_authenticated_verifier: false,
    integrity_status: 'clear',
    integrity_reason: null,
    risk_signals: {},
    requester_ip_hash: null,
    requester_user_agent_hash: null,
    integrity_meta: {},
    integrity_flagged_at: null,
    claim_snapshot: {
      roleClaim: { id: 'role', label: 'Role participation' },
      outcomeClaims: [{ id: 'outcome:o1', outcomeId: 'o1', label: 'Outcome one' }],
      artifactsClaim: { id: 'artifacts', label: 'Artifacts', enabled: true },
    },
    created_at: '2026-02-20T00:00:00.000Z',
    expires_at: '2099-02-20T00:00:00.000Z',
  };

  const impactStory = overrides?.impactStory || {
    id: 'story-1',
    title: 'Impact Story',
    user_id: 'story-owner-1',
    role_title: 'Program Lead',
    role_scope: 'owned',
    affiliation_details: 'Voice of Ukrainians in Sweden',
    org_description: 'Community organization',
    measured_outcomes: [
      {
        id: 'o1',
        change: 'Increased people supported',
        label: 'People supported',
        value: 120,
        unit: 'people',
      },
    ],
    supporting_artifacts: [{ id: 'artifact-1', title: 'Report' }],
  };
  const requesterProfile = overrides?.requesterProfile || {
    email: 'requester@example.com',
    display_name: 'Requester',
    avatar_url: null,
  };
  const storyOwnerProfile = overrides?.storyOwnerProfile || {
    email: 'owner@example.com',
    display_name: 'Story Owner',
    avatar_url: null,
  };

  const impactRequestSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: impactRequest, error: null }),
    }),
  });

  const impactRequestUpdate = vi.fn((payload: any) => {
    overrides?.onImpactRequestUpdate?.(payload);
    return {
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
  });

  const impactStoryUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const impactStoryUpdate = vi.fn((payload: any) => {
    overrides?.onImpactStoryUpdate?.(payload);
    return { eq: impactStoryUpdateEq };
  });

  return {
    from: vi.fn((table: string) => {
      if (table === 'impact_story_verification_requests') {
        return {
          select: impactRequestSelect,
          update: impactRequestUpdate,
        };
      }

      if (table === 'impact_stories') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: impactStory, error: null }),
            }),
          }),
          update: impactStoryUpdate,
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn((_: string, value: string) => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  value === impactRequest.requester_profile_id
                    ? requesterProfile
                    : value === impactStory.user_id
                      ? storyOwnerProfile
                      : null,
                error: null,
              }),
            })),
          }),
        };
      }

      if (table === 'impact_story_verification_responses') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function buildEmptyImpactAdminClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })),
  };
}

function buildAdminClientForSkillFlow(overrides?: {
  verificationByToken?: any;
  tokenLookupError?: any;
  verificationById?: any;
  idLookupError?: any;
  requesterProfile?: any;
  requesterProfileFallback?: any;
  requesterProfileSelectError?: any;
  skillProofs?: any[];
  skillEvidenceStrength?: string;
  onSkillVerificationUpdate?: (payload: any) => void;
  onSkillUpdate?: (payload: any) => void;
}) {
  const verificationByToken =
    overrides?.verificationByToken === undefined
      ? SKILL_VERIFICATION_RECORD
      : overrides.verificationByToken;
  const verificationById =
    overrides?.verificationById === undefined
      ? SKILL_VERIFICATION_RECORD
      : overrides.verificationById;
  const requesterProfile = overrides?.requesterProfile || {
    display_name: 'Requester',
    avatar_url: null,
    email: 'requester@example.com',
  };
  const requesterProfileFallback = overrides?.requesterProfileFallback || {
    display_name: requesterProfile.display_name,
    avatar_url: requesterProfile.avatar_url,
  };
  const skillProofs = overrides?.skillProofs || [];
  const skillEvidenceStrength = overrides?.skillEvidenceStrength || '0.3';

  return {
    from: vi.fn((table: string) => {
      if (table === 'impact_story_verification_requests') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }

      if (table === 'skill_verification_requests') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn((column: string) => {
              if (column === 'verification_token') {
                return {
                  single: vi.fn().mockResolvedValue(
                    overrides?.tokenLookupError
                      ? { data: null, error: overrides.tokenLookupError }
                      : {
                          data: verificationByToken,
                          error: verificationByToken
                            ? null
                            : {
                                code: 'PGRST116',
                                message: 'No rows found',
                              },
                        }
                  ),
                };
              }

              if (column === 'id') {
                return {
                  single: vi.fn().mockResolvedValue(
                    overrides?.idLookupError
                      ? { data: null, error: overrides.idLookupError }
                      : {
                          data: verificationById,
                          error: verificationById
                            ? null
                            : {
                                code: 'PGRST116',
                                message: 'No rows found',
                              },
                        }
                  ),
                };
              }

              throw new Error(`Unexpected lookup column: ${column}`);
            }),
          }),
          update: vi.fn((payload: any) => {
            overrides?.onSkillVerificationUpdate?.(payload);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'skills') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { evidence_strength: skillEvidenceStrength },
                error: null,
              }),
            }),
          }),
          update: vi.fn((payload: any) => {
            overrides?.onSkillUpdate?.(payload);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        };
      }

      if (table === 'profiles') {
        return {
          select: vi.fn((selectClause: string) => ({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: requesterProfile,
                error: null,
              }),
              maybeSingle: vi
                .fn()
                .mockResolvedValue(
                  overrides?.requesterProfileSelectError && selectClause.includes('email')
                    ? { data: null, error: overrides.requesterProfileSelectError }
                    : selectClause.includes('email')
                      ? { data: requesterProfile, error: null }
                      : { data: requesterProfileFallback, error: null }
                ),
            }),
          })),
        };
      }

      if (table === 'skill_proofs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: skillProofs,
                error: null,
              }),
            })),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('verify impact token route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });
    sendEmailMock.mockResolvedValue({ success: true });
  });

  it('GET returns impact-story payload with non-empty why-you-are-receiving-this text', async () => {
    createAdminClientMock.mockReturnValue(buildImpactAdminClient());

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('impact_story');
    expect(body.verification.story_title).toBe('Impact Story');
    expect(body.verification.claims.roleClaim.id).toBe('role');
    expect(body.verification.why_you_are_receiving_this).toContain('Requester');
    expect(body.verification.why_you_are_receiving_this).toContain('Program Director');
  });

  it('GET prefers requester_profile_id over impact story owner for requester identity', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-42',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Reviewer',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        impactStory: {
          id: 'story-1',
          title: 'Impact Story',
          user_id: 'owner-99',
          org_description: 'Community org',
          measured_outcomes: [],
          supporting_artifacts: [],
        },
        requesterProfile: {
          email: 'requester42@example.com',
          display_name: 'Requester Preferred',
          avatar_url: null,
        },
        storyOwnerProfile: {
          email: 'owner99@example.com',
          display_name: 'Story Owner',
          avatar_url: null,
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.requester_name).toBe('Requester Preferred');
    expect(body.verification.requester_email).toBe('requester42@example.com');
  });

  it('GET reconstructs claims from impact story when claim_snapshot is empty', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Program Director',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.claims.roleClaim.id).toBe('role');
    expect(body.verification.claims.outcomeClaims.length).toBeGreaterThan(0);
    expect(body.verification.claims.outcomeClaims[0].id).toBe('outcome:o1');
    expect(body.verification.why_you_are_receiving_this).toMatch(/voice of ukrainians in sweden/i);
  });

  it('GET prefers change-first labels when structured outcomes include change text', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-change-first',
          impact_story_id: 'story-change-first',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Program Director',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        impactStory: {
          id: 'story-change-first',
          title: 'Change-first Story',
          user_id: 'story-owner-1',
          role_title: 'Program Lead',
          role_scope: 'owned',
          affiliation_details: 'Voice of Ukrainians in Sweden',
          org_description: 'Community organization',
          measured_outcomes: [
            {
              id: 'o-change-1',
              change: 'Increased awareness among local communities',
              label: 'YouTube engagement',
              value: null,
              unit: null,
            },
          ],
          supporting_artifacts: [],
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.claims.outcomeClaims[0]).toMatchObject({
      id: 'outcome:o-change-1',
      label: 'Increased awareness among local communities',
    });
  });

  it('GET falls back to requester_email_snapshot when profile identity is unavailable', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          requester_email_snapshot: 'snapshot.person@example.com',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Program Director',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        requesterProfile: {
          email: null,
          display_name: null,
          avatar_url: null,
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.requester_name).toBe('Snapshot Person');
    expect(body.verification.requester_email).toBe('snapshot.person@example.com');
    expect(body.verification.why_you_are_receiving_this).toContain('Snapshot Person');
  });

  it('GET preserves profile display name when profiles email column is unavailable', async () => {
    const impactRequest = {
      id: 'req-email-drift',
      impact_story_id: 'story-1',
      requester_profile_id: 'requester-1',
      requester_email_snapshot: 'p.samoshko97@icloud.com',
      verifier_email: 'verifier@example.com',
      verifier_relationship: 'Program Director',
      status: 'pending',
      claim_snapshot: {
        context: {
          requesterEmail: 'p.samoshko97@icloud.com',
        },
      },
      created_at: '2026-02-20T00:00:00.000Z',
      expires_at: '2099-02-20T00:00:00.000Z',
    };

    const impactStory = {
      id: 'story-1',
      title: 'Impact Story',
      user_id: 'story-owner-1',
      role_title: 'Program Lead',
      role_scope: 'owned',
      affiliation_details: 'Voice of Ukrainians in Sweden',
      org_description: 'Community organization',
      measured_outcomes: [],
      supporting_artifacts: [],
    };

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'impact_story_verification_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: impactRequest, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
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
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn((selectClause: string) => ({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(
                  selectClause.includes('email')
                    ? {
                        data: null,
                        error: {
                          code: 'PGRST204',
                          message:
                            "Could not find the 'email' column of 'profiles' in the schema cache",
                        },
                      }
                    : {
                        data: {
                          display_name: 'Pavlo Samoshko',
                          avatar_url: null,
                        },
                        error: null,
                      }
                ),
              }),
            })),
          };
        }

        if (table === 'impact_story_verification_responses') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.requester_name).toBe('Pavlo Samoshko');
    expect(body.verification.requester_email).toBe('p.samoshko97@icloud.com');
  });

  it('GET reconstructs legacy outcome claims from outcomes text when structured outcomes are missing', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-legacy',
          impact_story_id: 'story-legacy',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Program Director',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        impactStory: {
          id: 'story-legacy',
          title: 'Legacy Impact Story',
          user_id: 'story-owner-1',
          role_title: 'Program Lead',
          role_scope: 'owned',
          affiliation_details: 'Voice of Ukrainians in Sweden',
          org_description: 'Community organization',
          outcomes: 'Supported 12 families with housing aid',
          measured_outcomes: [],
          supporting_artifacts: [],
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.claims.outcomeClaims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'outcome:legacy',
        }),
      ])
    );
    expect(body.verification.claims.outcomeClaims[0].label).toMatch(/Supported 12 families/i);
  });

  it('POST accepts impact claim confirmations from reconstructed claim data', async () => {
    let impactUpdatePayload: any = null;
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          verifier_relationship: 'Program Director',
          status: 'pending',
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        onImpactStoryUpdate: (payload) => {
          impactUpdatePayload = payload;
        },
      })
    );

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          confirmedClaimIds: ['role', 'outcome:o1'],
          message: 'Confirmed from records',
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification_type).toBe('impact_story');
    expect(body.status).toBe('accepted');
    expect(body.confirmed_claims.role).toBe(true);
    expect(body.confirmed_claims.outcomes).toEqual(['o1']);
    expect(impactUpdatePayload).toMatchObject({ verified: true });
  });

  it('POST returns AUTH_REQUIRED for flagged requests that require authenticated verifier', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-need-auth',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          status: 'pending',
          requires_authenticated_verifier: true,
          integrity_status: 'flagged',
          integrity_reason: 'suspected_collusion',
          risk_signals: {},
          requester_ip_hash: null,
          requester_user_agent_hash: null,
          integrity_meta: {},
          integrity_flagged_at: null,
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
      })
    );

    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          confirmedClaimIds: ['role'],
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'AUTH_REQUIRED',
    });
  });

  it('POST rejects authenticated mismatched verifier identity', async () => {
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-mismatch',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          status: 'pending',
          requires_authenticated_verifier: true,
          integrity_status: 'flagged',
          integrity_reason: 'suspected_collusion',
          risk_signals: {},
          requester_ip_hash: null,
          requester_user_agent_hash: null,
          integrity_meta: {},
          integrity_flagged_at: null,
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
      })
    );

    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'other-user', email: 'other@example.com' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          confirmedClaimIds: ['role'],
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: 'VERIFIER_IDENTITY_MISMATCH',
    });
  });

  it('POST allows matching authenticated verifier and records authenticated response method', async () => {
    let impactRequestUpdatePayload: any = null;
    createAdminClientMock.mockReturnValue(
      buildImpactAdminClient({
        impactRequest: {
          id: 'req-auth-ok',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-1',
          verifier_email: 'verifier@example.com',
          status: 'pending',
          requires_authenticated_verifier: true,
          integrity_status: 'flagged',
          integrity_reason: 'suspected_collusion',
          risk_signals: {},
          requester_ip_hash: null,
          requester_user_agent_hash: null,
          integrity_meta: {},
          integrity_flagged_at: null,
          claim_snapshot: {},
          created_at: '2026-02-20T00:00:00.000Z',
          expires_at: '2099-02-20T00:00:00.000Z',
        },
        onImpactRequestUpdate: (payload) => {
          impactRequestUpdatePayload = payload;
        },
      })
    );

    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'verifier-user-1', email: 'verifier@example.com' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
          confirmedClaimIds: ['role'],
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(200);
    expect(impactRequestUpdatePayload).toMatchObject({
      response_auth_method: 'authenticated',
      response_actor_email: 'verifier@example.com',
    });
  });

  it('GET falls back to legacy request id lookup when verification_token column is unavailable', async () => {
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        verificationByToken: null,
        tokenLookupError: {
          code: 'PGRST204',
          message:
            "Could not find the 'verification_token' column of 'skill_verification_requests' in the schema cache",
        },
        verificationById: {
          ...SKILL_VERIFICATION_RECORD,
          id: LEGACY_REQUEST_ID,
        },
      })
    );

    const response = await GET(
      new NextRequest(`http://localhost/api/verify/${LEGACY_REQUEST_ID}`),
      {
        params: Promise.resolve({ token: LEGACY_REQUEST_ID }),
      }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.id).toBe(LEGACY_REQUEST_ID);
    expect(body.verification.skill_name).toBe('System Design');
  });

  it('GET resolves skill verification token through admin client for signed-out verifier', async () => {
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        verificationByToken: {
          ...SKILL_VERIFICATION_RECORD,
          id: 'skill-req-token',
        },
      })
    );
    createClientMock.mockReturnValue({
      from: vi.fn(() => {
        throw new Error('createClient.from should not be used for skill token lookup');
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.id).toBe('skill-req-token');
  });

  it('GET skill flow preserves requester display name when profiles email column is unavailable', async () => {
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        verificationByToken: {
          ...SKILL_VERIFICATION_RECORD,
          requester_email_snapshot: 'snapshot.person@example.com',
        },
        requesterProfile: {
          display_name: 'Pavlo Samoshko',
          avatar_url: null,
          email: null,
        },
        requesterProfileFallback: {
          display_name: 'Pavlo Samoshko',
          avatar_url: null,
        },
        requesterProfileSelectError: {
          code: 'PGRST204',
          message: "Could not find the 'email' column of 'profiles' in the schema cache",
        },
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.requester_name).toBe('Pavlo Samoshko');
    expect(body.verification.requester_email).toBe('snapshot.person@example.com');
  });

  it('GET skill flow returns attached proof metadata for verifier context', async () => {
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        skillProofs: [
          {
            id: 'proof-cert-1',
            proof_type: 'certification',
            title: 'Swedish B2 Certificate',
            description: 'Official language certificate',
            url: 'https://cdn.proofound.test/certificates/swedish-b2.png',
            file_path: 'proof/user-1/swedish-b2.png',
            issued_date: '2024-01-01',
            expires_date: '2028-01-01',
          },
          {
            id: 'proof-link-2',
            proof_type: 'link',
            title: 'Project demo',
            description: null,
            url: 'https://example.com/demo',
            file_path: null,
            issued_date: null,
            expires_date: null,
          },
        ],
      })
    );

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.proofs).toHaveLength(2);
    expect(body.verification.proofs[0]).toMatchObject({
      id: 'proof-cert-1',
      proof_type: 'certification',
      title: 'Swedish B2 Certificate',
      url: 'https://cdn.proofound.test/certificates/swedish-b2.png',
    });
    expect(body.verification.proofs[1]).toMatchObject({
      id: 'proof-link-2',
      proof_type: 'link',
      title: 'Project demo',
    });
  });

  it('GET succeeds for valid skill token when relation embed is ambiguous (PGRST201)', async () => {
    const { skills: _ignoredSkills, ...verificationWithoutEmbeddedSkill } =
      SKILL_VERIFICATION_RECORD;
    const hydratedSkill = {
      skill_id: 'custom-1-2-3-system-design',
      skill_code: null,
      custom_skill_name: null,
      taxonomy: {
        name_i18n: {
          en: 'System Design',
        },
      },
    };

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'impact_story_verification_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn((query: string) => ({
              eq: vi.fn((column: string) => ({
                single: vi.fn().mockResolvedValue(
                  column === 'verification_token'
                    ? query.includes('skills!skill_verification_requests_skill_id_fkey')
                      ? { data: null, error: SKILL_RELATION_AMBIGUITY_ERROR }
                      : { data: verificationWithoutEmbeddedSkill, error: null }
                    : {
                        data: null,
                        error: { code: 'PGRST116', message: 'No rows found' },
                      }
                ),
              })),
            })),
          };
        }

        if (table === 'skills') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: hydratedSkill, error: null }),
              }),
            }),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    display_name: 'Requester',
                    avatar_url: null,
                    email: 'requester@example.com',
                  },
                  error: null,
                }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    display_name: 'Requester',
                    avatar_url: null,
                    email: 'requester@example.com',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === 'skill_proofs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const response = await GET(new NextRequest(`http://localhost/api/verify/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.verification.verification_type).toBe('skill');
    expect(body.verification.skill_name).toBe('System Design');
  });

  it('POST succeeds for valid skill token when relation embed is ambiguous (PGRST201)', async () => {
    const { skills: _ignoredSkills, ...verificationWithoutEmbeddedSkill } =
      SKILL_VERIFICATION_RECORD;
    const hydratedSkill = {
      skill_id: 'custom-1-2-3-system-design',
      skill_code: null,
      custom_skill_name: null,
      taxonomy: {
        name_i18n: {
          en: 'System Design',
        },
      },
    };
    let updatePayload: any = null;

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'impact_story_verification_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        if (table === 'skill_verification_requests') {
          return {
            select: vi.fn((query: string) => ({
              eq: vi.fn((column: string) => ({
                single: vi.fn().mockResolvedValue(
                  column === 'verification_token'
                    ? query.includes('skills!skill_verification_requests_skill_id_fkey')
                      ? { data: null, error: SKILL_RELATION_AMBIGUITY_ERROR }
                      : { data: verificationWithoutEmbeddedSkill, error: null }
                    : {
                        data: null,
                        error: { code: 'PGRST116', message: 'No rows found' },
                      }
                ),
              })),
            })),
            update: vi.fn((payload: any) => {
              updatePayload = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }

        if (table === 'skills') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: hydratedSkill, error: null }),
              }),
            }),
          };
        }

        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { email: 'requester@example.com', display_name: 'Requester' },
                  error: null,
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'decline',
          message: 'Cannot verify right now',
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      status: 'declined',
      verification_type: 'skill',
    });
    expect(updatePayload).toMatchObject({
      status: 'declined',
    });
  });

  it('POST allows unauthenticated skill verifier when authenticated verifier is not required', async () => {
    let updatePayload: any = null;
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        verificationByToken: {
          ...SKILL_VERIFICATION_RECORD,
          id: 'skill-req-open',
          requires_authenticated_verifier: false,
        },
        onSkillVerificationUpdate: (payload) => {
          updatePayload = payload;
        },
      })
    );
    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'decline',
          message: 'Cannot verify right now',
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      status: 'declined',
    });
    expect(updatePayload).toMatchObject({
      status: 'declined',
      response_auth_method: 'token',
      response_actor_email: null,
    });
  });

  it('POST returns AUTH_REQUIRED for skill requests requiring authenticated verifier', async () => {
    createAdminClientMock.mockReturnValue(
      buildAdminClientForSkillFlow({
        verificationByToken: {
          ...SKILL_VERIFICATION_RECORD,
          id: 'skill-req-auth',
          requires_authenticated_verifier: true,
          integrity_status: 'flagged',
          integrity_reason: 'suspected_collusion',
        },
      })
    );
    createClientMock.mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(
      new NextRequest(`http://localhost/api/verify/${TOKEN}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'accept',
        }),
      }),
      { params: Promise.resolve({ token: TOKEN }) }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: 'AUTH_REQUIRED',
    });
  });
});
