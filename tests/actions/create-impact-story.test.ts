import { beforeEach, describe, expect, it, vi } from 'vitest';
import { impactStories } from '@/db/schema';
import { createImpactStory } from '@/actions/profile';

const mockDbInsert = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());
const mockRequireAuth = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());
const mockCreateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockFindExistingCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockUpdateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  createCanonicalImpactVerificationRequest: mockCreateCanonicalImpactVerificationRequest,
  findExistingCanonicalImpactVerificationRequest:
    mockFindExistingCanonicalImpactVerificationRequest,
  mapCanonicalImpactVerificationRequestRecord: vi.fn((record: any) => record),
  updateCanonicalImpactVerificationRequest: mockUpdateCanonicalImpactVerificationRequest,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const BASE_STORY = {
  title: 'Built AI workflow',
  orgDescription: 'Acme',
  impact: 'Improved onboarding speed by 40%.',
  businessValue: 'Saved 10 hours per week.',
  outcomes: 'Reduced manual work',
  timeline: '2025',
  verified: false,
  timelineStructured: {
    mode: 'range' as const,
    precision: 'year' as const,
    start: '2024',
    end: '2025',
  },
  affiliationType: 'organization' as const,
  affiliationDetails: 'Engineering lead',
  roleTitle: 'Director',
  roleScope: 'owned' as const,
  primaryCause: 'Reliability',
  secondaryCauses: ['Transparency'],
  measuredOutcomes: [
    {
      id: 'outcome-1',
      change: 'Increased time saved for operations team',
      label: 'Time saved',
      value: 10,
      unit: 'hours',
      valueMode: 'absolute' as const,
      timeframe: 'monthly',
      baseline: null,
      after: 10,
      confidence: 'exact' as const,
    },
  ],
  supportingArtifacts: [
    {
      id: 'artifact-1',
      kind: 'link' as const,
      title: 'Workflow evidence',
      url: 'https://example.com/evidence',
    },
  ],
};

describe('createImpactStory verification email path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: 'user-1' });
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'requester@example.com' } },
          error: null,
        }),
      },
    });
    mockHeaders.mockResolvedValue(new Headers());
    mockFindExistingCanonicalImpactVerificationRequest.mockResolvedValue(null);
    mockCreateCanonicalImpactVerificationRequest.mockResolvedValue({
      record: {
        id: 'verification-1',
        integrityStatus: 'clear',
        createdAt: new Date('2026-02-27T09:00:00.000Z'),
      },
      rawToken: 'a'.repeat(64),
      expiresAt: new Date('2026-03-13T09:00:00.000Z'),
    });
    mockUpdateCanonicalImpactVerificationRequest.mockResolvedValue({});
  });

  function createProfileInsertMock({
    emailResult,
  }: {
    emailResult: { success: boolean; error?: string; id?: string };
  }) {
    const insertCalls: Array<{ table: unknown; payload: any }> = [];

    mockDbInsert.mockImplementation((table: unknown) => {
      return {
        values: vi.fn((payload: any) => {
          insertCalls.push({ table, payload });

          if (table === impactStories) {
            return {
              returning: vi.fn().mockResolvedValue([
                {
                  id: 'story-1',
                  title: payload.title,
                },
              ]),
            };
          }

          throw new Error(`Unexpected insert table: ${String(table)}`);
        }),
      };
    });

    mockDbUpdate.mockImplementation((table: unknown) => ({
      set: vi.fn((payload: any) => {
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    mockSendEmail.mockResolvedValue(emailResult);

    return { insertCalls };
  }

  it('stores lowercase verifier email and marks verification as sent when email sends', async () => {
    createProfileInsertMock({
      emailResult: { success: true, id: 'resend-id-1' },
    });

    const result = await createImpactStory({
      ...(BASE_STORY as any),
      verificationRequest: {
        verifierEmail: 'Verifier@Example.com',
        verifierName: 'Verifier Example',
        verifierRelationship: 'Manager',
        message: 'Please confirm the reported impact.',
      },
    } as any);

    expect(result.id).toBe('story-1');
    expect(result.verificationWarning).toBeNull();

    expect(mockCreateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        impactStoryId: 'story-1',
        verifierEmail: 'verifier@example.com',
      })
    );

    const sentArgs = vi.mocked(mockSendEmail).mock.calls[0];
    expect(sentArgs?.[0]).toMatchObject({
      to: 'verifier@example.com',
      subject: `${BASE_STORY.title} verification request on Proofound`,
    });
    const verificationUrl = sentArgs?.[0].html.match(
      /https?:\/\/[^"']+\/verify\/[a-f0-9]{64}/
    )?.[0];
    expect(verificationUrl).toBeDefined();

    expect(mockUpdateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'verification-1',
        status: 'pending',
        emailSent: true,
        emailError: null,
      })
    );
  });

  it('returns warning and stores email error when verification email fails', async () => {
    createProfileInsertMock({
      emailResult: { success: false, error: 'Resend unavailable' },
    });

    const result = await createImpactStory({
      ...(BASE_STORY as any),
      verificationRequest: {
        verifierEmail: 'Verifier@Example.com',
        verifierName: 'Verifier Example',
        verifierRelationship: 'Manager',
        message: 'Please confirm the reported impact.',
      },
    } as any);

    expect(result.id).toBe('story-1');
    expect(result.verificationWarning).toBe('Resend unavailable');

    expect(mockCreateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        impactStoryId: 'story-1',
        verifierEmail: 'verifier@example.com',
      })
    );
    expect(mockUpdateCanonicalImpactVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'verification-1',
        status: 'failed',
        emailError: 'Resend unavailable',
      })
    );
  });

  it('keeps impact story save and blocks self verification request creation', async () => {
    const insertCalls: Array<{ table: unknown; payload: any }> = [];
    mockCreateClient.mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: 'owner+alias@example.com' } },
          error: null,
        }),
      },
    });

    mockDbInsert.mockImplementation((table: unknown) => {
      return {
        values: vi.fn((payload: any) => {
          insertCalls.push({ table, payload });

          if (table === impactStories) {
            return {
              returning: vi.fn().mockResolvedValue([{ id: 'story-self', title: payload.title }]),
            };
          }

          throw new Error(`Unexpected insert table: ${String(table)}`);
        }),
      };
    });

    const result = await createImpactStory({
      ...(BASE_STORY as any),
      verificationRequest: {
        verifierEmail: 'owner@example.com',
        verifierName: 'Owner',
        verifierRelationship: 'Manager',
      },
    } as any);

    expect(result.id).toBe('story-self');
    expect(result.verificationWarning).toMatch(/self-verification requests are not allowed/i);
    expect(insertCalls).toHaveLength(1);
    expect(mockCreateCanonicalImpactVerificationRequest).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
