import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirstMock = vi.fn();
const inspectCapabilityTokenMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    query: {
      verificationRecords: {
        findFirst: (...args: any[]) => findFirstMock(...args),
      },
    },
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    EMAIL_HASH: 'email_hash',
    EMAIL_THEN_PROFILE_LOCK: 'email_then_profile_lock',
  },
  CAPABILITY_TOKEN_CLASSES: {
    SKILL_VERIFICATION_RESPONSE: 'skill_verification_response',
    IMPACT_VERIFICATION_RESPONSE: 'impact_verification_response',
  },
  inspectCapabilityToken: (...args: any[]) => inspectCapabilityTokenMock(...args),
  issueCapabilityToken: vi.fn(),
}));

import { getCanonicalSkillVerificationRequestByToken } from '@/lib/verification/canonical-requests';
import { getCanonicalImpactVerificationRequestByToken } from '@/lib/verification/canonical-impact-requests';

function buildVerificationRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    ownerType: 'individual_profile',
    ownerId: 'owner-1',
    subjectType: 'skill',
    subjectId: 'subject-1',
    proofArtifactId: null,
    verificationSlot: 'skill.attestation',
    verificationKind: 'skill_attestation_peer',
    status: 'pending',
    verifierPrincipalType: 'external_email',
    verifierClass: 'authenticated_peer',
    verifierProfileId: null,
    verifierOrgId: null,
    verifierEmailHash: 'hash',
    verifierDomainSnapshot: 'example.com',
    integrityStatus: 'clear',
    integrityReason: null,
    disputeState: 'none',
    badgeSemanticsVersion: 2,
    riskSignals: {},
    claimSnapshot: {},
    sourceRequestTable: 'verification_records',
    sourceRequestId: '11111111-1111-4111-8111-111111111111',
    sourceResponseTable: null,
    sourceResponseId: null,
    requestedAt: new Date('2026-03-15T10:00:00.000Z'),
    expiresAt: new Date('2026-03-29T10:00:00.000Z'),
    requestExpiresAt: new Date('2026-03-29T10:00:00.000Z'),
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
    metadata: {
      requestTransport: 'skill_verification_request',
      requesterEmailSnapshot: 'requester@example.com',
      verifierEmail: 'Verifier@Example.com',
      verifierSource: 'peer',
      verifierRelationship: 'Peer reviewer',
      requestKind: 'generic_verification',
      message: 'Please verify this skill.',
      capabilityTokenId: 'cap-token-1',
      requiresAuthenticatedVerifier: false,
      integrityMeta: {},
      integrityFlaggedAt: null,
    },
    createdAt: new Date('2026-03-15T10:00:00.000Z'),
    updatedAt: new Date('2026-03-15T10:00:00.000Z'),
    ...overrides,
  };
}

describe('canonical verification token resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves skill verification tokens through canonical verification_records only', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: true,
      token: { source_id: '11111111-1111-4111-8111-111111111111' },
    });
    findFirstMock.mockResolvedValue(buildVerificationRecord());

    const result = await getCanonicalSkillVerificationRequestByToken('raw-token');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      skill_id: 'subject-1',
      verifier_email: 'verifier@example.com',
      source_request_table: 'verification_records',
      source_request_id: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('returns null for skill tokens when the canonical row is missing or transport mismatched', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: true,
      token: { source_id: '11111111-1111-4111-8111-111111111111' },
    });
    findFirstMock.mockResolvedValue(
      buildVerificationRecord({
        metadata: {
          requestTransport: 'impact_verification_request',
          verifierEmail: 'verifier@example.com',
        },
      })
    );

    const result = await getCanonicalSkillVerificationRequestByToken('raw-token');

    expect(result).toEqual({ data: null, error: null });
  });

  it('returns null for skill tokens when inspect succeeds but no source_id exists', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: true,
      token: { source_id: null },
    });

    const result = await getCanonicalSkillVerificationRequestByToken('raw-token');

    expect(result).toEqual({ data: null, error: null });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it('resolves impact verification tokens through canonical verification_records only', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: true,
      token: { source_id: '22222222-2222-4222-8222-222222222222' },
    });
    findFirstMock.mockResolvedValue(
      buildVerificationRecord({
        id: '22222222-2222-4222-8222-222222222222',
        subjectType: 'impact_story',
        subjectId: 'impact-story-1',
        verificationSlot: 'impact_story.attestation',
        verificationKind: 'impact_attestation',
        metadata: {
          requestTransport: 'impact_verification_request',
          requesterEmailSnapshot: 'requester@example.com',
          verifierEmail: 'Verifier@Example.com',
          verifierName: 'Verifier Person',
          verifierRelationship: 'Manager',
          message: 'Please verify this impact story.',
          claimSnapshot: {},
          capabilityTokenId: 'cap-token-2',
          requiresAuthenticatedVerifier: false,
          integrityMeta: {},
          integrityFlaggedAt: null,
        },
      })
    );

    const result = await getCanonicalImpactVerificationRequestByToken('raw-token');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      impact_story_id: 'impact-story-1',
      verifier_email: 'verifier@example.com',
      source_request_table: 'verification_records',
      source_request_id: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('returns capability-token errors without falling back to legacy request tables', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: false,
      reason: 'invalid',
    });

    const result = await getCanonicalImpactVerificationRequestByToken('raw-token');

    expect(result).toEqual({ data: null, error: 'invalid' });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it('returns terminal capability-token states for skill lookups without querying legacy transport', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: false,
      reason: 'expired',
    });

    const result = await getCanonicalSkillVerificationRequestByToken('raw-token');

    expect(result).toEqual({ data: null, error: 'expired' });
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it('returns revoked capability-token states for impact lookups without querying legacy transport', async () => {
    inspectCapabilityTokenMock.mockResolvedValue({
      ok: false,
      reason: 'revoked',
    });

    const result = await getCanonicalImpactVerificationRequestByToken('raw-token');

    expect(result).toEqual({ data: null, error: 'revoked' });
    expect(findFirstMock).not.toHaveBeenCalled();
  });
});
