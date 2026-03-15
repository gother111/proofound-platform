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

vi.mock('@/lib/verification/canonical-requests', () => ({
  listCanonicalSkillVerificationRequestsForOwner: vi.fn(),
  listCanonicalSkillVerificationRequestsForVerifierEmail: vi.fn(),
  mapCanonicalSkillVerificationRequestRecord: vi.fn((record: any) => record),
}));

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  listCanonicalImpactVerificationRequestsForOwner: vi.fn(),
  listCanonicalImpactVerificationRequestsForVerifierEmail: vi.fn(),
  mapCanonicalImpactVerificationRequestRecord: vi.fn((record: any) => record),
}));

vi.mock('@/app/app/i/verifications/VerificationsClient', () => ({
  VerificationsClient: (props: unknown) => {
    verificationsClientSpy(props);
    return <div data-testid="verifications-client-proxy" />;
  },
}));

import VerificationsPage from '@/app/app/i/verifications/page';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  listCanonicalSkillVerificationRequestsForVerifierEmail,
} from '@/lib/verification/canonical-requests';
import {
  listCanonicalImpactVerificationRequestsForOwner,
  listCanonicalImpactVerificationRequestsForVerifierEmail,
} from '@/lib/verification/canonical-impact-requests';

function createSupabaseClientMock(options: {
  userEmail: string;
  emailConfirmedAt?: string | null;
  canonicalSkillDetails?: unknown[];
  canonicalRequesterProfiles?: unknown[];
  impactStories?: unknown[];
}) {
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
        return {
          in: vi.fn().mockResolvedValue({
            data:
              table === 'skills'
                ? (options.canonicalSkillDetails ?? [])
                : table === 'profiles'
                  ? (options.canonicalRequesterProfiles ?? [])
                  : table === 'impact_stories'
                    ? (options.impactStories ?? [])
                    : [],
            error: null,
          }),
        };
      }),
    })),
  };
}

describe('VerificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminClientMock.mockReset();
    requireAuthMock.mockResolvedValue({ id: 'user-1' });
    vi.mocked(listCanonicalProofPackAggregatesForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([]);
    vi.mocked(listCanonicalImpactVerificationRequestsForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalImpactVerificationRequestsForVerifierEmail).mockResolvedValue([]);
  });

  it('merges skill and impact requests for incoming and sent views', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        canonicalSkillDetails: [
          {
            id: 'skill-1',
            competency_level: 4,
            skills_taxonomy: {
              name_i18n: {
                en: 'Systems Thinking',
              },
            },
          },
          {
            id: 'skill-2',
            competency_level: 5,
            skills_taxonomy: {
              name_i18n: {
                en: 'Program Management',
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
          {
            id: 'requester-2',
            display_name: 'Taylor Impact',
            handle: 'taylor-impact',
            avatar_url: null,
          },
        ],
        impactStories: [
          {
            id: 'story-1',
            title: 'Climate Adaptation',
          },
          {
            id: 'story-2',
            title: 'Public Health Program',
          },
        ],
      })
    );
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([
      {
        id: 'skill-incoming-1',
        skill_id: 'skill-1',
        requester_profile_id: 'requester-1',
        verifier_email: 'user@example.com',
        verifier_source: 'peer',
        status: 'pending',
        created_at: '2026-02-25T10:00:00.000Z',
      },
    ] as any);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([
      {
        id: 'skill-sent-1',
        skill_id: 'skill-2',
        requester_profile_id: 'user-1',
        verifier_email: 'reviewer@example.com',
        verifier_source: 'manager',
        status: 'accepted',
        created_at: '2026-02-22T10:00:00.000Z',
      },
    ] as any);
    vi.mocked(listCanonicalImpactVerificationRequestsForVerifierEmail).mockResolvedValue([
      {
        id: 'impact-incoming-1',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-2',
        verifier_email: 'user@example.com',
        verifier_name: 'Taylor',
        verifier_relationship: 'Partner',
        status: 'pending',
        created_at: '2026-02-26T10:00:00.000Z',
      },
    ] as any);
    vi.mocked(listCanonicalImpactVerificationRequestsForOwner).mockResolvedValue([
      {
        id: 'impact-sent-1',
        impact_story_id: 'story-2',
        requester_profile_id: 'user-1',
        verifier_email: 'impact-reviewer@example.com',
        verifier_name: 'Alex Reviewer',
        verifier_relationship: 'Client',
        status: 'accepted',
        created_at: '2026-02-24T10:00:00.000Z',
      },
    ] as any);

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
  });

  it('loads canonical feed data without using the admin client', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        canonicalSkillDetails: [
          {
            id: 'skill-1',
            competency_level: 3,
            skills_taxonomy: {
              name_i18n: {
                en: 'Facilitation',
              },
            },
          },
        ],
      })
    );
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([
      {
        id: 'skill-incoming-only',
        skill_id: 'skill-1',
        requester_profile_id: 'requester-1',
        verifier_email: 'user@example.com',
        verifier_source: 'peer',
        status: 'pending',
        created_at: '2026-02-25T10:00:00.000Z',
      },
    ] as any);

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();
    expect(createAdminClientMock).not.toHaveBeenCalled();

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
        impactStories: [
          {
            id: 'story-2',
            title: 'Legacy Impact Story',
          },
        ],
      })
    );
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
    vi.mocked(listCanonicalImpactVerificationRequestsForOwner).mockResolvedValue([
      {
        id: 'impact-sent-1',
        impact_story_id: 'story-2',
        requester_profile_id: 'user-1',
        verifier_email: 'impact-reviewer@example.com',
        verifier_name: 'Alex Reviewer',
        verifier_relationship: 'Client',
        status: 'accepted',
        created_at: '2026-02-24T10:00:00.000Z',
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
    createClientMock.mockResolvedValue(
      createSupabaseClientMock({
        userEmail: 'user@example.com',
        emailConfirmedAt: null,
      })
    );
    vi.mocked(listCanonicalSkillVerificationRequestsForVerifierEmail).mockResolvedValue([]);
    vi.mocked(listCanonicalSkillVerificationRequestsForOwner).mockResolvedValue([]);
    vi.mocked(listCanonicalImpactVerificationRequestsForVerifierEmail).mockResolvedValue([
      {
        id: 'impact-incoming-unverified-email',
        impact_story_id: 'story-1',
        requester_profile_id: 'requester-2',
        verifier_email: 'user@example.com',
        verifier_name: 'Taylor',
        verifier_relationship: 'Partner',
        status: 'pending',
        created_at: '2026-02-26T10:00:00.000Z',
      },
    ] as any);

    const element = await VerificationsPage();
    render(element);

    expect(screen.getByTestId('verifications-client-proxy')).toBeInTheDocument();
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(listCanonicalImpactVerificationRequestsForVerifierEmail).not.toHaveBeenCalled();

    const props = verificationsClientSpy.mock.calls[0]?.[0] as {
      incomingRequests: Array<{ id: string; subjectType: string }>;
    };

    expect(props.incomingRequests).toHaveLength(0);
  });
});
