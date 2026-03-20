import { describe, expect, it } from 'vitest';

import { summarizeVerificationPolicy } from '@/lib/verification/policy';

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'record-1',
    ownerType: 'individual_profile',
    ownerId: 'profile-1',
    subjectType: 'individual_profile',
    subjectId: 'profile-1',
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

describe('summarizeVerificationPolicy', () => {
  it('keeps veriff identity internal-only and removes compatibility trust tiers', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
          verificationKind: 'veriff_identity',
          verificationSlot: 'individual.identity',
          status: 'verified',
          verifierClass: 'system_provider',
          verifiedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
          lastRefreshedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.identity.publicLabel).toBe('Identity checked');
    expect(summary.slots.identity.activeTrust).toBe(true);
    expect(summary.compatibility.verificationTier).toBe('unverified');
    expect(summary.compatibility.verificationMethod).toBe('veriff');
    expect(summary.compatibility.verified).toBe(false);
    expect(summary.publicBadges.some((badge) => badge.key === 'identity_checked')).toBe(false);
    expect(summary.orgReviewBadges.some((badge) => badge.key === 'identity_checked')).toBe(false);
  });

  it('expires workplace confirmation after the freshness window without deleting history', () => {
    const summary = summarizeVerificationPolicy({
      now: new Date('2026-03-08T00:00:00.000Z'),
      records: [
        makeRecord({
          verificationKind: 'work_email',
          verificationSlot: 'individual.workplace',
          status: 'verified',
          verifiedAt: new Date('2024-12-01T00:00:00.000Z'),
          completedAt: new Date('2024-12-01T00:00:00.000Z'),
          updatedAt: new Date('2024-12-01T00:00:00.000Z'),
          lastRefreshedAt: new Date('2024-12-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.workplace.state).toBe('expired');
    expect(summary.slots.workplace.publicLabel).toBe('Verification expired');
    expect(summary.compatibility.workEmailVerified).toBe(false);
    expect(summary.compatibility.workEmailNeedsReverify).toBe(true);
    expect(summary.activeIssues).toContainEqual(
      expect.objectContaining({ issueKey: 'expired', slot: 'individual.workplace' })
    );
  });

  it('surfaces contradictions conservatively for organization trust badges', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
          ownerType: 'organization',
          ownerId: 'org-1',
          subjectType: 'organization',
          subjectId: 'org-1',
          verificationKind: 'platform_manual_review',
          verificationSlot: 'organization.platform_review',
          status: 'contradicted',
          integrityStatus: 'contradicted',
          verifierClass: 'manual_platform_reviewer',
          contradictedAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.organizationPlatformReview.state).toBe('contradicted');
    expect(summary.slots.organizationPlatformReview.publicLabel).toBe('Trust review changed');
    expect(summary.compatibility.orgTrustTier).toBe('unreviewed');
    expect(summary.compatibility.orgTrustStatus).toBe('unverified');
    expect(summary.publicBadges.some((badge) => badge.key === 'trust_review_changed')).toBe(false);
    expect(summary.orgReviewBadges.some((badge) => badge.key === 'trust_review_changed')).toBe(
      true
    );
  });

  it('keeps workplace verification as compatibility only for public trust', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
          verificationKind: 'work_email',
          verificationSlot: 'individual.workplace',
          status: 'verified',
          verifierClass: 'system_signal',
          verifiedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
          lastRefreshedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.workplace.publicLabel).toBe('Workplace-verified');
    expect(summary.compatibility.verificationTier).toBe('unverified');
    expect(summary.compatibility.verificationMethod).toBe('work_email');
    expect(summary.publicBadges).not.toContainEqual(
      expect.objectContaining({ key: 'workplace_confirmed', label: 'Workplace-verified' })
    );
  });

  it('removes workplace trust when the verification is contradicted', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
          verificationKind: 'work_email',
          verificationSlot: 'individual.workplace',
          status: 'contradicted',
          integrityStatus: 'contradicted',
          verifierClass: 'system_signal',
          contradictedAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.workplace.state).toBe('contradicted');
    expect(summary.slots.workplace.activeTrust).toBe(false);
    expect(summary.compatibility.workEmailVerified).toBe(false);
    expect(summary.publicBadges).not.toContainEqual(
      expect.objectContaining({ key: 'workplace_confirmed' })
    );
    expect(summary.activeIssues).toContainEqual(
      expect.objectContaining({ slot: 'individual.workplace', issueKey: 'changed' })
    );
  });

  it('does not let linkedin identity create a global compatibility tier', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
          verificationKind: 'linkedin_identity',
          verificationSlot: 'individual.identity',
          status: 'verified',
          verifierClass: 'system_provider',
          verifiedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
          lastRefreshedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      ],
    });

    expect(summary.slots.identity.activeTrust).toBe(true);
    expect(summary.compatibility.verificationTier).toBe('unverified');
    expect(summary.compatibility.verified).toBe(false);
    expect(summary.compatibility.verificationMethod).toBe('linkedin');
    expect(summary.publicBadges).toEqual([]);
  });

  it('builds scoped proof labels from canonical attestation records only', () => {
    const summary = summarizeVerificationPolicy({
      records: [
        makeRecord({
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
      ],
    });

    expect(summary.scopedSignals).toEqual([
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
  });
});
