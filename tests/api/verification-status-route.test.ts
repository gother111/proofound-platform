import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/verification/policy', async () => {
  const actual = await vi.importActual<typeof import('@/lib/verification/policy')>(
    '@/lib/verification/policy'
  );

  return {
    ...actual,
    listVerificationRecordsForOwner: vi.fn().mockResolvedValue([]),
  };
});

import { createClient } from '@/lib/supabase/server';
import { listVerificationRecordsForOwner } from '@/lib/verification/policy';
import { GET } from '@/app/api/verification/status/route';

type VerificationProfile = {
  verified: boolean;
  verification_method: 'veriff' | 'work_email' | 'linkedin' | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  verification_tier?: 'unverified' | 'workplace_verified' | 'identity_verified' | null;
  verification_tier_source?:
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'veriff'
    | 'unknown'
    | null;
  verified_at: string | null;
  linkedin_verification_status?: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  linkedin_verification_level?:
    | 'unverified'
    | 'pending'
    | 'workplace'
    | 'identity'
    | 'failed'
    | null;
  linkedin_verified_at?: string | null;
  linkedin_verification_data?: Record<string, unknown> | null;
  work_email: string | null;
  work_email_verified: boolean;
  work_email_verified_at: string | null;
  work_email_reverify_due_at: string | null;
  work_email_token_hash: string | null;
  work_email_token_expires: string | null;
};

type ProfileQueryResult = {
  data: VerificationProfile | null;
  error?: { code?: string; message?: string; details?: string | null; hint?: string | null } | null;
};

function createSupabaseMock(options: {
  authUser?: { id: string } | null;
  authError?: Error | null;
  profile?: VerificationProfile | null;
  profileError?: { code?: string; message?: string; details?: string } | null;
  profileResponses?: ProfileQueryResult[];
}) {
  const {
    authUser = { id: 'user-1' },
    authError = null,
    profile = null,
    profileError = null,
    profileResponses = [],
  } = options;

  const maybeSingle = vi.fn();
  if (profileResponses.length > 0) {
    profileResponses.forEach((response) => {
      maybeSingle.mockResolvedValueOnce({
        data: response.data,
        error: response.error ?? null,
      });
    });
  } else {
    maybeSingle.mockResolvedValue({
      data: profile,
      error: profileError,
    });
  }

  const individualProfilesQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'individual_profiles') {
        return individualProfilesQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  } as any;
}

function makeRequest() {
  return new NextRequest('https://proofound.io/api/verification/status', {
    method: 'GET',
  });
}

function makeVerificationRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'record-1',
    ownerType: 'individual_profile',
    ownerId: 'user-1',
    subjectType: 'individual_profile',
    subjectId: 'user-1',
    proofArtifactId: null,
    verificationSlot: null,
    verificationKind: 'work_email',
    status: 'pending',
    verifierPrincipalType: 'system',
    verifierClass: 'system_signal',
    verifierProfileId: null,
    verifierOrgId: null,
    verifierEmailHash: null,
    verifierDomainSnapshot: null,
    integrityStatus: 'unknown',
    integrityReason: null,
    disputeState: 'none',
    badgeSemanticsVersion: 2,
    riskSignals: {},
    claimSnapshot: {},
    sourceRequestTable: null,
    sourceRequestId: null,
    sourceResponseTable: null,
    sourceResponseId: null,
    requestedAt: null,
    expiresAt: null,
    requestExpiresAt: null,
    followUpDueAt: null,
    lastFollowUpAt: null,
    lastRefreshedAt: null,
    completedAt: null,
    expiredAt: null,
    supersededAt: null,
    supersededByVerificationId: null,
    downgradedAt: null,
    contradictedAt: null,
    contradictedByVerificationId: null,
    disputedAt: null,
    revokedAt: null,
    cancelledAt: null,
    failureCode: null,
    verifiedAt: null,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as any;
}

describe('GET /api/verification/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([]);
  });

  it('derives pending status from active work email token when explicit status is missing', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: null,
        verified_at: null,
        work_email: 'person@acme.org',
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: 'token-hash-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('pending');
    expect(body.channels.workEmail.email).toBe('person@acme.org');
    expect(body.workflow).toBeNull();
    expect(body).not.toHaveProperty('verificationTier');
    expect(body).not.toHaveProperty('verificationMethod');
  });

  it('ignores legacy global failure flags when only token metadata exists', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'failed',
        verified_at: null,
        work_email: 'person@acme.org',
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: 'token-hash-123',
        work_email_token_expires: expiresAt,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('pending');
    expect(body.workflow).toBeNull();
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('marks legacy work email metadata as stale without synthesizing workflow state', async () => {
    const pastDue = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const verifiedAt = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: verifiedAt,
        work_email: 'person@acme.org',
        work_email_verified: true,
        work_email_verified_at: verifiedAt,
        work_email_reverify_due_at: pastDue,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('expired');
    expect(body.channels.workEmail.needsReverify).toBe(true);
    expect(body.channels.workEmail.reverifyDueAt).toBe(pastDue);
    expect(body.workflow).toBeNull();
  });

  it('keeps legacy work email metadata as a secondary verified signal only', async () => {
    const futureDue = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const verifiedAt = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: verifiedAt,
        work_email: 'person@acme.org',
        work_email_verified: true,
        work_email_verified_at: verifiedAt,
        work_email_reverify_due_at: futureDue,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('verified');
    expect(body.channels.workEmail.needsReverify).toBe(false);
    expect(body.channels.workEmail.reverifyDueAt).toBe(futureDue);
    expect(body.workflow).toBeNull();
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('lets canonical work email beat conflicting legacy verified flags', async () => {
    const verifiedAt = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'work_email',
        verification_status: 'verified',
        verified_at: verifiedAt,
        work_email: 'person@acme.org',
        work_email_verified: true,
        work_email_verified_at: verifiedAt,
        work_email_reverify_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([
      makeVerificationRecord({
        verificationKind: 'work_email',
        verificationSlot: 'individual.workplace',
        status: 'contradicted',
        integrityStatus: 'contradicted',
        contradictedAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      }),
    ]);
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.workEmail.state).toBe('contradicted');
    expect(body.channels.workEmail.needsReverify).toBe(false);
    expect(body.workflow?.state).toBe('contradicted');
    expect(body.summary.slots.workplace.state).toBe('contradicted');
  });

  it('does not create workflow from legacy global verified flags alone', async () => {
    const supabase = createSupabaseMock({
      profile: {
        verified: true,
        verification_method: 'linkedin',
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        work_email: null,
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.workflow).toBeNull();
    expect(body.channels.workEmail.state).toBe('unverified');
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('fails honestly when required verification columns are missing', async () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const supabase = createSupabaseMock({
      profileResponses: [
        {
          data: null,
          error: {
            code: '42703',
            message: 'column individual_profiles.work_email_verified_at does not exist',
          },
        },
      ],
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to fetch verification status');
    expect(body.details).toContain('does not exist');
  });

  it('keeps LinkedIn signals channel-scoped without global trust inflation', async () => {
    const nowIso = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'unverified',
        verified_at: null,
        linkedin_verification_status: 'verified',
        linkedin_verified_at: nowIso,
        linkedin_verification_data: {
          hasIdentityVerification: true,
        },
        work_email: null,
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.linkedin.state).toBe('verified');
    expect(body.channels.linkedin.signalLevel).toBe('identity');
    expect(body.channels.linkedin.hasIdentitySignal).toBe(true);
    expect(body.channels.linkedin.verifiedAt).toBe(nowIso);
    expect(body).not.toHaveProperty('linkedinVerificationLevel');
    expect(body).not.toHaveProperty('linkedinHasIdentityVerification');
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('lets canonical linkedin state beat conflicting legacy linkedin flags', async () => {
    const nowIso = new Date().toISOString();
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'unverified',
        verified_at: null,
        linkedin_verification_status: 'failed',
        linkedin_verification_level: 'failed',
        linkedin_verified_at: nowIso,
        linkedin_verification_data: {
          hasIdentityVerification: false,
        },
        work_email: null,
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([
      makeVerificationRecord({
        verificationKind: 'linkedin_identity',
        verificationSlot: 'individual.identity',
        status: 'verified',
        verifierClass: 'system_provider',
        verifiedAt: new Date('2026-02-01T00:00:00.000Z'),
        completedAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        lastRefreshedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    ]);
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.channels.linkedin.state).toBe('verified');
    expect(body.channels.linkedin.signalLevel).toBe('identity');
    expect(body.channels.linkedin.hasIdentitySignal).toBe(true);
    expect(body.summary.publicBadges).toEqual([]);
  });

  it('returns claim-scoped trust labels and freshness from canonical proof verification records', async () => {
    const supabase = createSupabaseMock({
      profile: {
        verified: false,
        verification_method: null,
        verification_status: 'unverified',
        verified_at: null,
        work_email: null,
        work_email_verified: false,
        work_email_verified_at: null,
        work_email_reverify_due_at: null,
        work_email_token_hash: null,
        work_email_token_expires: null,
      },
    });
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([
      makeVerificationRecord({
        subjectType: 'skill',
        subjectId: 'skill-1',
        verificationKind: 'skill_attestation_peer',
        verificationSlot: 'skill.attestation',
        status: 'verified',
        verifierClass: 'authenticated_peer',
        verifiedAt: new Date('2026-03-10T00:00:00.000Z'),
        completedAt: new Date('2026-03-10T00:00:00.000Z'),
        updatedAt: new Date('2026-03-10T00:00:00.000Z'),
        lastRefreshedAt: new Date('2026-03-10T00:00:00.000Z'),
        claimSnapshot: {
          claimTemplate: 'skill_observed_in_context',
          claimLabel: 'This skill was directly observed in this context',
        },
      }),
    ]);
    (createClient as any).mockResolvedValue(supabase);

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.summary.scopedSignals).toEqual([
      expect.objectContaining({
        subjectType: 'skill',
        subjectId: 'skill-1',
        claimTemplate: 'skill_observed_in_context',
        claimLabel: 'This skill was directly observed in this context',
        trustType: 'peer_attested',
        trustLabel: 'peer-attested',
        supportLabel: 'artifact-backed',
        freshnessState: 'active',
        freshnessLabel: null,
      }),
    ]);
    expect(body).not.toHaveProperty('verificationTier');
  });
});
