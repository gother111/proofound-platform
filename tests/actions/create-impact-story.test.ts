import { beforeEach, describe, expect, it, vi } from 'vitest';
import { impactStories, impactStoryVerificationRequests } from '@/db/schema';
import { createImpactStory } from '@/actions/profile';

const mockDbInsert = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());
const mockRequireAuth = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());

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
  });

  function createProfileInsertMock({
    emailResult,
  }: {
    emailResult: { success: boolean; error?: string; id?: string };
  }) {
    const insertCalls: Array<{ table: unknown; payload: any }> = [];
    const updateCalls: Array<{ table: unknown; payload: any }> = [];

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

          if (table === impactStoryVerificationRequests) {
            return {
              returning: vi.fn().mockResolvedValue([{ id: 'verification-1' }]),
            };
          }

          throw new Error(`Unexpected insert table: ${String(table)}`);
        }),
      };
    });

    mockDbUpdate.mockImplementation((table: unknown) => ({
      set: vi.fn((payload: any) => {
        updateCalls.push({ table, payload });
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }));

    mockSendEmail.mockResolvedValue(emailResult);

    return { insertCalls, updateCalls };
  }

  it('stores lowercase verifier email and marks verification as sent when email sends', async () => {
    const { insertCalls, updateCalls } = createProfileInsertMock({
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

    expect(insertCalls[1]).toMatchObject({
      table: impactStoryVerificationRequests,
      payload: expect.objectContaining({
        verifierEmail: 'verifier@example.com',
      }),
    });

    const sentArgs = vi.mocked(mockSendEmail).mock.calls[0];
    expect(sentArgs?.[0]).toMatchObject({
      to: 'Verifier@Example.com',
      subject: `${BASE_STORY.title} verification request on Proofound`,
    });
    expect(sentArgs?.[0].html).toMatch(/https?:\/\/[^\"'\\s]+\/verify\/[a-f0-9]{64}/);

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      payload: expect.objectContaining({
        emailSentAt: expect.any(Date),
      }),
    });
  });

  it('returns warning and stores email error when verification email fails', async () => {
    const { insertCalls, updateCalls } = createProfileInsertMock({
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

    expect(insertCalls[1]).toMatchObject({
      table: impactStoryVerificationRequests,
      payload: expect.objectContaining({
        verifierEmail: 'verifier@example.com',
      }),
    });

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      payload: expect.objectContaining({
        status: 'failed',
        emailError: 'Resend unavailable',
      }),
    });
  });
});
