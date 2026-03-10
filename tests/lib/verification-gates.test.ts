import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkVerificationGates } from '@/lib/verification/gates';
import { db } from '@/db';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import { listVerificationRecordsForOwner } from '@/lib/verification/policy';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/proofs/canonical-pack', async () => {
  const actual = await vi.importActual<typeof import('@/lib/proofs/canonical-pack')>(
    '@/lib/proofs/canonical-pack'
  );

  return {
    ...actual,
    listCanonicalProofPackAggregatesForOwner: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('@/lib/verification/policy', async () => {
  const actual = await vi.importActual<typeof import('@/lib/verification/policy')>(
    '@/lib/verification/policy'
  );

  return {
    ...actual,
    listVerificationRecordsForOwner: vi.fn().mockResolvedValue([]),
  };
});

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'record-1',
    ownerType: 'individual_profile',
    ownerId: 'user-1',
    subjectType: 'individual_profile',
    subjectId: 'user-1',
    proofArtifactId: null,
    verificationSlot: 'individual.identity',
    verificationKind: 'veriff_identity',
    status: 'verified',
    verifierPrincipalType: 'system',
    verifierClass: 'system_provider',
    verifierProfileId: null,
    verifierOrgId: null,
    verifierEmailHash: null,
    verifierDomainSnapshot: null,
    integrityStatus: 'clear',
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
    lastRefreshedAt: new Date('2026-02-01T00:00:00.000Z'),
    completedAt: new Date('2026-02-01T00:00:00.000Z'),
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
    verifiedAt: new Date('2026-02-01T00:00:00.000Z'),
    metadata: {},
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  } as any;
}

describe('checkVerificationGates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats string[] verification_gates as required canonical gates', async () => {
    (db.execute as any).mockResolvedValueOnce([{ verification_gates: ['identity', 'work_email'] }]);
    vi.mocked(listVerificationRecordsForOwner).mockResolvedValue([
      makeRecord({
        verificationSlot: 'individual.identity',
        verificationKind: 'veriff_identity',
      }),
    ]);
    vi.mocked(listCanonicalProofPackAggregatesForOwner).mockResolvedValue([]);

    const result = await checkVerificationGates('user-1', 'assignment-1');

    expect(result.canIntroduce).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.unmetGates).toEqual([
      expect.objectContaining({ type: 'work_email', required: true }),
    ]);
    expect(result.userVerifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'identity', verified: true }),
        expect.objectContaining({ type: 'work_email', verified: false }),
      ])
    );
  });

  it('fails closed when verification lookup errors', async () => {
    (db.execute as any).mockRejectedValueOnce(new Error('db down'));

    const result = await checkVerificationGates('user-1', 'assignment-1');

    expect(result.passed).toBe(false);
    expect(result.canIntroduce).toBe(false);
    expect(result.blockingMessage).toContain('Verification checks could not be completed');
  });
});
