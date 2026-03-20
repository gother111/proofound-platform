import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbInsert = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());
const mockDbSelect = vi.hoisted(() => vi.fn());
const mockRequireAuth = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockCreateClient = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());
const mockCreateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockFindExistingCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());
const mockMapCanonicalImpactVerificationRequestRecord = vi.hoisted(() => vi.fn());
const mockUpdateCanonicalImpactVerificationRequest = vi.hoisted(() => vi.fn());

vi.mock('@/db', () => ({
  db: {
    insert: mockDbInsert,
    update: mockDbUpdate,
    select: mockDbSelect,
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

vi.mock('@/lib/verification/canonical-impact-requests', () => ({
  createCanonicalImpactVerificationRequest: mockCreateCanonicalImpactVerificationRequest,
  findExistingCanonicalImpactVerificationRequest:
    mockFindExistingCanonicalImpactVerificationRequest,
  listCanonicalImpactVerificationRequestsForOwner: vi.fn(),
  mapCanonicalImpactVerificationRequestRecord: mockMapCanonicalImpactVerificationRequestRecord,
  updateCanonicalImpactVerificationRequest: mockUpdateCanonicalImpactVerificationRequest,
}));

vi.mock('next/headers', () => ({
  headers: mockHeaders,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { createImpactStory } from '@/actions/profile';
import { impactStories } from '@/db/schema';

const BASE_STORY = {
  title: 'Community Climate Accelerator',
  orgDescription: 'Climate Lab',
  impact: 'Built a resilience coaching program.',
  businessValue: 'Reduced onboarding time by 30%.',
  outcomes: '30% faster onboarding',
  timeline: '2025',
  verified: false,
  timelineStructured: {
    mode: 'range' as const,
    precision: 'year' as const,
    start: '2024',
    end: '2025',
  },
  affiliationType: 'organization' as const,
  affiliationDetails: 'Climate Lab',
  roleTitle: 'Program Lead',
  roleScope: 'owned' as const,
  primaryCause: 'Climate adaptation',
  secondaryCauses: ['Education'],
  measuredOutcomes: [
    {
      id: 'outcome-1',
      change: 'Increased participants trained through the program',
      label: 'Participants trained',
      value: 120,
      unit: 'people',
      valueMode: 'absolute' as const,
      timeframe: 'annual',
      baseline: null,
      after: 120,
      confidence: 'exact' as const,
    },
  ],
  supportingArtifacts: [
    {
      id: 'artifact-1',
      kind: 'link' as const,
      title: 'Program deck',
      url: 'https://example.com/deck',
    },
  ],
};

describe('createImpactStory schema-drift compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: 'user-1' });
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
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
        id: 'canonical-impact-request-1',
        createdAt: new Date('2026-03-15T10:00:00.000Z'),
        integrityStatus: 'clear',
      },
      rawToken: 'impact-capability-token',
    });
    mockMapCanonicalImpactVerificationRequestRecord.mockImplementation((row: any) => row);
    mockUpdateCanonicalImpactVerificationRequest.mockResolvedValue({});
  });

  it('falls back to legacy insert mode when structured impact columns are unavailable', async () => {
    const impactPayloads: Array<Record<string, unknown>> = [];
    let impactInsertAttempt = 0;

    mockDbInsert.mockImplementation((table: unknown) => ({
      values: vi.fn((payload: Record<string, unknown>) => {
        if (table !== impactStories) {
          throw new Error(`Unexpected table insert: ${String(table)}`);
        }

        impactPayloads.push(payload);
        impactInsertAttempt += 1;

        if (impactInsertAttempt === 1) {
          return {
            returning: vi.fn().mockRejectedValue(
              new Error('column "timeline_structured" does not exist', {
                cause: { code: '42703' },
              } as any)
            ),
          };
        }

        return {
          returning: vi.fn().mockResolvedValue([{ id: 'story-legacy', ...payload }]),
        };
      }),
    }));

    const result = await createImpactStory(BASE_STORY as any);

    expect(result.id).toBe('story-legacy');
    expect(result.saveMode).toBe('legacy_fallback');
    expect(result.saveWarning).toMatch(/compatibility mode/i);
    expect(result.verificationWarning).toBeNull();
    expect(impactPayloads).toHaveLength(2);
    expect(impactPayloads[0]).toHaveProperty('timelineStructured');
    expect(impactPayloads[1]).not.toHaveProperty('timelineStructured');
  });

  it('keeps story save successful when canonical verification storage is missing', async () => {
    mockDbInsert.mockImplementation((table: unknown) => ({
      values: vi.fn((payload: Record<string, unknown>) => {
        if (table === impactStories) {
          return {
            returning: vi.fn().mockResolvedValue([{ id: 'story-1', ...payload }]),
          };
        }

        throw new Error(`Unexpected table insert: ${String(table)}`);
      }),
    }));
    mockCreateCanonicalImpactVerificationRequest.mockRejectedValue({
      code: '42P01',
      message: 'relation "verification_records" does not exist',
    });

    const result = await createImpactStory({
      ...(BASE_STORY as any),
      verificationRequest: {
        verifierEmail: 'verifier@example.com',
        verifierName: 'Verifier',
        verifierRelationship: 'manager',
        message: 'Please validate this story.',
      },
    });

    expect(result.id).toBe('story-1');
    expect(result.saveMode).toBe('legacy_fallback');
    expect(result.saveWarning).toMatch(/canonical verification storage is unavailable/i);
    expect(result.verificationWarning).toMatch(/verification storage is unavailable/i);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('reuses existing canonical impact verification requests and avoids duplicate inserts', async () => {
    mockDbInsert.mockImplementation((table: unknown) => ({
      values: vi.fn((payload: Record<string, unknown>) => {
        if (table === impactStories) {
          return {
            returning: vi.fn().mockResolvedValue([{ id: 'story-dup', ...payload }]),
          };
        }

        throw new Error(`Unexpected table insert: ${String(table)}`);
      }),
    }));
    mockFindExistingCanonicalImpactVerificationRequest.mockResolvedValue({
      id: 'existing-impact-request',
    });
    mockMapCanonicalImpactVerificationRequestRecord.mockReturnValue({
      id: 'existing-impact-request',
      status: 'accepted',
      verifier_email: 'verifier@example.com',
      created_at: '2026-02-20T10:00:00.000Z',
      email_sent: true,
      email_error: null,
    });

    const result = await createImpactStory({
      ...(BASE_STORY as any),
      verificationRequest: {
        verifierEmail: 'Verifier@Example.com',
        verifierName: 'Verifier',
        verifierRelationship: 'manager',
        message: 'Please validate this story.',
      },
    });

    expect(result.id).toBe('story-dup');
    expect(result.verificationRequestStatus).toBe('accepted');
    expect(result.verificationVerifierEmail).toBe('verifier@example.com');
    expect(result.verificationWarning).toMatch(/active verification request already exists/i);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockCreateCanonicalImpactVerificationRequest).not.toHaveBeenCalled();
  });
});
