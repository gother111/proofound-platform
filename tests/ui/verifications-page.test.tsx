import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAuthMock, createClientMock, createAdminClientMock, verificationsClientSpy } =
  vi.hoisted(() => ({
    requireAuthMock: vi.fn(),
    createClientMock: vi.fn(),
    createAdminClientMock: vi.fn(),
    verificationsClientSpy: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: vi.fn(),
}));

vi.mock('@/lib/verification/policy', () => ({
  listVerificationRecordsForOwner: vi.fn(),
}));

vi.mock('@/lib/verification/canonical-requests', () => ({
  listCanonicalSkillVerificationRequestsForOwner: vi.fn(),
  listCanonicalSkillVerificationRequestsForVerifierEmail: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
}));

vi.mock('@/app/app/i/verifications/VerificationsClient', () => ({
  VerificationsClient: (props: unknown) => {
    verificationsClientSpy(props);
    return <div data-testid="verifications-client-proxy" />;
  },
}));

import VerificationsPage from '@/app/app/i/verifications/page';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import { listVerificationRecordsForOwner } from '@/lib/verification/policy';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  listCanonicalSkillVerificationRequestsForVerifierEmail,
} from '@/lib/verification/canonical-requests';

type QueryResult = { data: unknown[]; error: null };

function createSupabaseClientMock(options: {
  userEmail: string;
  emailConfirmedAt?: string | null;
  incomingSkill: unknown[];
  sentSkill: unknown[];
  sentImpact: unknown[];
  canonicalSkillDetails?: unknown[];
  canonicalRequesterProfiles?: unknown[];
  capturedSkillSelects?: string[];
}) {
  const resolveQuery = (table: string, column: string): QueryResult => {
    if (table === 'skill_verification_requests' && column === 'verifier_email') {
      return { data: options.incomingSkill, error: null };
    }
    if (table === 'skill_verification_requests' && column === 'requester_profile_id') {
      return { data: options.sentSkill, error: null };
    }
    if (table === 'impact_story_verification_requests' && column === 'requester_profile_id') {
      return { data: options.sentImpact, error: null };
    }
    return { data: [], error: null };
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            email: options.userEmail,
            email_confirmed_at:
              options.emailConfirmedAt === undefined
                ? '2026-02-01T00:00:00.000Z'
                : options.emailConfirmedAt,
          },
        },
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn((selectQuery?: string) => {
        if (table === 'skill_verification_requests' && typeof selectQuery === 'string') {
          options.capturedSkillSelects?.push(selectQuery);
        }

        return {
          eq: vi.fn((column: string) => ({
            order: vi.fn().mockResolvedValue(resolveQuery(table, column)),
          })),
          in: vi.fn().mockResolvedValue({
            data:
              table === 'skills'
                ? (options.canonicalSkillDetails ?? [])
                : table === 'profiles'
                  ? (options.canonicalRequesterProfiles ?? [])
                  : [],
            error: null,
          }),
        };
      }),
    })),
  };
}

function createAdminClientMockResult(incomingImpact: unknown[]) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: incomingImpact, error: null }),
        })),
      })),
    })),
  };
}

describe('VerificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminClientMock.mockReset();
    requireAuthMock.mockResolvedValue({ id: 'user-1' });
    vi.mocked(listCanonicalProofPackAggregatesForOwner).mockResolvedValue([]);
    vi.mocked(listVerificationRecordsForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([]);
  });

  it('merges skill and impact requests for incoming and sent views', async () => {
    const capturedSkillSelects: string[] = [];
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        incomingSkill: [
          {
            id: 'skill-incoming-1',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [
          {
            id: 'skill-sent-1',
            skill_id: 'skill-2',
            requester_profile_id: 'user-1',
            verifier_email: 'reviewer@example.com',
            verifier_source: 'manager',
            status: 'accepted',
            created_at: '2026-02-22T10:00:00.000Z',
          },
        ],
        sentImpact: [
          {
            id: 'impact-sent-1',
            impact_story_id: 'story-2',
            requester_profile_id: 'user-1',
            verifier_email: 'impact-reviewer@example.com',
            verifier_name: 'Alex Reviewer',
            verifier_relationship: 'Client',
            status: 'accepted',
            created_at: '2026-02-24T10:00:00.000Z',
            impact_stories: { id: 'story-2', title: 'Public Health Program' },
          },
        ],
        capturedSkillSelects,
      })
    );
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);

    createAdminClientMock.mockReturnValue(
      createAdminClientMockResult([
        {
          id: 'impact-incoming-1',
          impact_story_id: 'story-1',
          requester_profile_id: 'requester-2',
          verifier_email: 'user@example.com',
          verifier_name: 'Taylor',
          verifier_relationship: 'Partner',
          status: 'pending',
          created_at: '2026-02-26T10:00:00.000Z',
          impact_stories: { id: 'story-1', title: 'Climate Adaptation' },
          profiles: { id: 'requester-2', display_name: 'Jordan Sender' },
        },
      ])
    );

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();
    expect(verificationsClientSpy).toHaveBeenCalledTimes(1);

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; subjectType: string; createdAt: string }>;
      sentRequests: Array<{ id: string; subjectType: string; impactStoryTitle?: string | null }>;
    };

    expect(props.incomingRequests.map((request) => request.id)).toEqual([
      'impact-incoming-1',
      'skill-incoming-1',
    ]);
    expect(props.incomingRequests.map((request) => request.subjectType)).toEqual([
      'impact_story',
      'skill',
    ]);

    expect(props.sentRequests.map((request) => request.id)).toEqual([
      'impact-sent-1',
      'skill-sent-1',
    ]);
    expect(props.sentRequests.map((request) => request.subjectType)).toEqual([
      'impact_story',
      'skill',
    ]);
    expect(props.sentRequests[0]?.impactStoryTitle).toBe('Public Health Program');

    const combinedSkillSelect = capturedSkillSelects.join('\n');
    expect(combinedSkillSelect).toContain(
      'skills:skills!skill_verification_requests_skill_id_fkey'
    );
    expect(combinedSkillSelect).toContain('competency_level:level');
  });

  it('falls back gracefully when admin client for incoming impact requests is unavailable', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        incomingSkill: [
          {
            id: 'skill-incoming-only',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [],
        sentImpact: [],
      })
    );

    createAdminClientMock.mockImplementation(() => {
      throw new Error('Missing SUPABASE env for admin client');
    });

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; subjectType: string }>;
      sentRequests: unknown[];
    };

    expect(props.incomingRequests).toHaveLength(1);
    expect(props.incomingRequests[0]).toMatchObject({
      id: 'skill-incoming-only',
      subjectType: 'skill',
    });
    expect(props.sentRequests).toHaveLength(0);
  });

  it('enriches verification requests with canonical proof-pack context when available', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        incomingSkill: [
          {
            id: 'skill-incoming-1',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [],
        sentImpact: [
          {
            id: 'impact-sent-1',
            impact_story_id: 'story-2',
            requester_profile_id: 'user-1',
            verifier_email: 'impact-reviewer@example.com',
            verifier_name: 'Alex Reviewer',
            verifier_relationship: 'Client',
            status: 'accepted',
            created_at: '2026-02-24T10:00:00.000Z',
            impact_stories: { id: 'story-2', title: 'Legacy Impact Story' },
          },
        ],
        canonicalSkillDetails: [
          {
            id: 'skill-1',
            competency_level: 4,
            skills_taxonomy: {
              name_i18n: {
                en: 'Product Strategy',
              },
            },
          },
        ],
        canonicalRequesterProfiles: [
          {
            id: 'requester-1',
            display_name: 'Jordan Sender',
            handle: 'jordan-sender',
            avatar_url: null,
          },
        ],
      })
    );
    createAdminClientMock.mockReturnValue(createAdminClientMockResult([]));
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([
      {
        id: 'canonical-skill-incoming-1',
        skill_id: 'skill-1',
        requester_profile_id: 'requester-1',
        verifier_email: 'user@example.com',
        verifier_source: 'peer',
        status: 'pending',
        created_at: '2026-02-25T11:00:00.000Z',
      },
    ] as any);
    vi.mocked(listCanonicalProofPackAggregatesForOwner).mockResolvedValue([
      {
        pack: {
          id: 'pack-skill-1',
          title: 'Proof Pack: Product Strategy',
          summary: 'Launch evidence for Product Strategy',
          outcomesSummary: 'Shipped the portfolio launch in two weeks.',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-1',
        },
        ownerFull: {
          title: 'Proof Pack: Product Strategy',
          summary: 'Launch evidence for Product Strategy',
          outcomesSummary: 'Shipped the portfolio launch in two weeks.',
          items: [
            {
              artifact: {
                title: 'Launch memo',
              },
            },
          ],
        },
        verificationStatus: 'verified',
        latestEvidenceAt: new Date('2026-02-24T10:00:00.000Z'),
        verificationReferences: [],
      },
      {
        pack: {
          id: 'pack-impact-1',
          title: 'Proof Pack: Climate Adaptation',
          summary: 'External validation for climate adaptation work.',
          outcomesSummary: 'Reduced planning time by 35%.',
          primarySubjectType: 'impact_story',
          primarySubjectId: 'story-2',
        },
        ownerFull: {
          title: 'Proof Pack: Climate Adaptation',
          summary: 'External validation for climate adaptation work.',
          outcomesSummary: 'Reduced planning time by 35%.',
          items: [
            {
              artifact: {
                title: 'Client attestation',
              },
            },
          ],
        },
        verificationStatus: 'partially_verified',
        latestEvidenceAt: new Date('2026-02-24T10:00:00.000Z'),
        verificationReferences: [{ id: 'verification-impact-1' }],
      },
    ] as any);
    vi.mocked(listVerificationRecordsForOwner).mockResolvedValue([
      {
        id: 'verification-impact-1',
        sourceRequestTable: 'impact_story_verification_requests',
        sourceRequestId: 'impact-sent-1',
      },
    ] as any);

    const element = await VerificationsPage();
    render(element);

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{
        canonicalPackTitle?: string | null;
        canonicalEvidenceTitles?: string[];
      }>;
      sentRequests: Array<{
        id: string;
        canonicalPackTitle?: string | null;
        canonicalVerificationStatus?: string | null;
        canonicalOutcomesSummary?: string | null;
      }>;
    };

    expect(props.incomingRequests[0]).toMatchObject({
      canonicalPackTitle: 'Proof Pack: Product Strategy',
      canonicalEvidenceTitles: ['Launch memo'],
    });
    expect(props.sentRequests.find((request) => request.id === 'impact-sent-1')).toMatchObject({
      canonicalPackTitle: 'Proof Pack: Climate Adaptation',
      canonicalVerificationStatus: 'partially_verified',
      canonicalOutcomesSummary: 'Reduced planning time by 35%.',
    });
  });

  it('does not use admin client when session email is unconfirmed', async () => {
    createAdminClientMock.mockReturnValue(createAdminClientMockResult([]));

    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        emailConfirmedAt: null,
        incomingSkill: [
          {
            id: 'skill-incoming-only',
            skill_id: 'skill-1',
            requester_profile_id: 'requester-1',
            verifier_email: 'user@example.com',
            verifier_source: 'peer',
            status: 'pending',
            created_at: '2026-02-25T10:00:00.000Z',
          },
        ],
        sentSkill: [],
        sentImpact: [],
      })
    );
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();
    expect(createAdminClientMock).not.toHaveBeenCalled();

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; subjectType: string }>;
    };

    expect(props.incomingRequests).toHaveLength(1);
    expect(props.incomingRequests[0]).toMatchObject({
      id: 'skill-incoming-only',
      subjectType: 'skill',
    });
  });
});
