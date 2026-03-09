/** @vitest-environment node */

import { describe, expect, it } from 'vitest';

import {
  SubmissionSchema,
  SubmissionArtifactSchema,
  VerificationLogEntrySchema,
  mapLegacyOrganizationVisibility,
  mapLegacyProfileVisibility,
  mapLegacyProofVisibility,
} from '@/lib/contracts/canonical-domain';
import { buildMatchAuditFields, CANONICAL_MATCH_SCORE_VERSION } from '@/lib/canonical/repository';
import {
  buildCanonicalMatchScoreArtifact,
  compareCanonicalMatchOrder,
  MATCH_SCORE_CONTRACT_VERSION,
} from '@/lib/matching/match-score-contract';

describe('canonical visibility mapping', () => {
  it('maps legacy individual visibility to the canonical model', () => {
    expect(mapLegacyProfileVisibility('public')).toEqual({
      visibility: 'public',
      revealGate: 'none',
    });
    expect(mapLegacyProfileVisibility('network_only')).toEqual({
      visibility: 'link_only',
      revealGate: 'none',
    });
    expect(mapLegacyProfileVisibility('match_only')).toEqual({
      visibility: 'matched_org',
      revealGate: 'match_exists',
    });
    expect(mapLegacyProfileVisibility('hidden')).toEqual({
      visibility: 'owner_only',
      revealGate: 'none',
    });
  });

  it('maps legacy organization and proof visibility to reveal-gated canonical values', () => {
    expect(mapLegacyOrganizationVisibility('post_match')).toEqual({
      visibility: 'matched_org',
      revealGate: 'match_exists',
    });
    expect(mapLegacyOrganizationVisibility('post_conversation_start')).toEqual({
      visibility: 'matched_org',
      revealGate: 'conversation_started',
    });
    expect(mapLegacyProofVisibility('match-only')).toEqual({
      visibility: 'matched_org',
      revealGate: 'match_exists',
    });
  });
});

describe('match audit persistence helpers', () => {
  it('builds stable hashes and explainable reason codes from canonical inputs', () => {
    const input = {
      scoreVersion: CANONICAL_MATCH_SCORE_VERSION,
      assignmentId: '11111111-1111-4111-8111-111111111111',
      profileId: '22222222-2222-4222-8222-222222222222',
      weights: {
        skills: 0.4,
        pac: 0.3,
        verifications: 0.2,
        compensation: 0.1,
      },
      subscores: {
        skills: 0.82,
        pac: 0.74,
        verifications: 0.81,
        availability: 0.88,
        location: 0.9,
        compensation: 0.79,
        language: 0.76,
      },
      missing: [],
      gaps: [],
      focusBoost: {
        matched: {
          role: true,
          industry: false,
          orgType: true,
        },
      },
      verificationGates: ['work_email'],
    } satisfies Parameters<typeof buildMatchAuditFields>[0];

    const first = buildMatchAuditFields(input);
    const second = buildMatchAuditFields(input);

    expect(first.inputsHash).toBe(second.inputsHash);
    expect(first.reasonCodes).toEqual([
      'skills_strong',
      'purpose_alignment_strong',
      'verification_ready',
      'logistics_fit',
      'compensation_fit',
      'language_fit',
      'focus_role',
      'focus_org_type',
    ]);
  });
});

describe('match score contract v1', () => {
  const baseInput = {
    assignmentId: '11111111-1111-4111-8111-111111111111',
    profileId: '22222222-2222-4222-8222-222222222222',
    assignmentOrgId: '33333333-3333-4333-8333-333333333333',
    assignmentStatus: 'active',
    matchabilityEligible: true,
    matchingConsentActive: true,
    requiredSkills: [{ id: 'typescript', level: 4 }],
    niceToHaveSkills: [{ id: 'graphql', level: 3 }],
    candidateSkills: {
      typescript: {
        id: 'typescript',
        level: 5,
        evidenceStrength: 0.8,
        recencyMultiplier: 0.9,
        impactScore: 0.7,
      },
      graphql: {
        id: 'graphql',
        level: 3,
        evidenceStrength: 0.6,
        recencyMultiplier: 0.8,
        impactScore: 0.5,
      },
    },
    assignmentValuesTags: ['privacy'],
    assignmentCauseTags: ['climate'],
    profileValuesTags: ['privacy'],
    profileCauseTags: ['climate'],
    assignmentStartEarliest: '2026-03-10',
    assignmentStartLatest: '2026-03-20',
    profileAvailabilityEarliest: '2026-03-12',
    assignmentHoursMin: 20,
    assignmentHoursMax: 40,
    profileHoursMin: 20,
    profileHoursMax: 40,
    assignmentLocationMode: 'remote',
    profileWorkMode: 'remote',
    assignmentCountry: 'SE',
    profileCountry: 'SE',
    assignmentCompMin: 100000,
    assignmentCompMax: 140000,
    profileCompAnnualRange: { min: 110000, max: 130000 },
    assignmentMinLanguage: { code: 'en', level: 'B2' },
    candidateLanguageLevel: 'C1',
    assignmentCanSponsorVisa: true,
    profileNeedsSponsorship: false,
    profileWishesSponsorship: false,
    verificationGates: ['work_email'],
    verifiedFlags: { work_email: true },
  } as const;

  it('is deterministic for identical inputs', () => {
    const first = buildCanonicalMatchScoreArtifact(baseInput);
    const second = buildCanonicalMatchScoreArtifact(baseInput);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first?.scoreVersion).toBe(MATCH_SCORE_CONTRACT_VERSION);
    expect(first?.scoreTotal).toBe(second?.scoreTotal);
    expect(first?.inputsHash).toBe(second?.inputsHash);
    expect(first?.reasonCodes).toEqual(second?.reasonCodes);
    expect(first?.subscoresJson).toEqual(second?.subscoresJson);
  });

  it('treats missing candidate data as zero instead of inflating the score', () => {
    const artifact = buildCanonicalMatchScoreArtifact({
      ...baseInput,
      candidateLanguageLevel: null,
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.subscoresJson.language).toBe(0);
    expect(Number(artifact?.subscoresJson.confidence_total)).toBeLessThan(10000);
  });

  it('uses the documented tie breaker order', () => {
    const left = {
      scoreTotal: 8500,
      subscoresJson: {
        skills_fit: 9000,
        constraints_fit: 8000,
        proof_fit: 7000,
        verification_fit: 10000,
        purpose_fit: 6000,
        confidence_total: 9000,
      },
      counterpartId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    };
    const right = {
      scoreTotal: 8500,
      subscoresJson: {
        skills_fit: 9000,
        constraints_fit: 8000,
        proof_fit: 7000,
        verification_fit: 10000,
        purpose_fit: 6000,
        confidence_total: 9000,
      },
      counterpartId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    };

    expect(compareCanonicalMatchOrder(left, right)).toBeGreaterThan(0);
  });
});

describe('canonical submission and verification audit contracts', () => {
  it('validates a canonical submission payload', () => {
    expect(
      SubmissionSchema.parse({
        id: '11111111-1111-4111-8111-111111111111',
        submissionKind: 'proof_card',
        status: 'submitted',
        ownerType: 'individual_profile',
        ownerId: '22222222-2222-4222-8222-222222222222',
        submittedByUserId: '22222222-2222-4222-8222-222222222222',
        submittedByOrgId: null,
        assignmentId: null,
        proofPackId: '33333333-3333-4333-8333-333333333333',
        requestContextType: 'candidate_invite',
        requestContextId: '44444444-4444-4444-8444-444444444444',
        matchId: null,
        introId: null,
        applicationId: null,
        legacySourceTable: 'org_candidate_invites',
        legacySourceId: '55555555-5555-4555-8555-555555555555',
        submittedAt: '2026-03-09T10:00:00.000Z',
        reviewedAt: null,
        withdrawnAt: null,
        supersededAt: null,
        supersededBySubmissionId: null,
        metadata: {
          proofSnippetId: '66666666-6666-4666-8666-666666666666',
        },
      })
    ).toMatchObject({
      submissionKind: 'proof_card',
      requestContextType: 'candidate_invite',
    });
  });

  it('validates submission artifact and verification log entry payloads', () => {
    expect(
      SubmissionArtifactSchema.parse({
        id: '77777777-7777-4777-8777-777777777777',
        submissionId: '11111111-1111-4111-8111-111111111111',
        artifactId: '88888888-8888-4888-8888-888888888888',
        position: 0,
        includedFields: ['title', 'sourceUrl'],
      })
    ).toMatchObject({
      position: 0,
    });

    expect(
      VerificationLogEntrySchema.parse({
        id: '99999999-9999-4999-8999-999999999999',
        verificationRecordId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        sequenceNumber: 2,
        entryType: 'expired',
        fromStatus: 'verified',
        toStatus: 'expired',
        reasonCode: 'freshness_window_elapsed',
        actorType: 'system',
        actorId: null,
        relatedContradictionId: null,
        relatedDisputeId: null,
        relatedVerificationRecordId: null,
        recomputeBatchId: null,
        metadata: {
          source: 'workflow.service',
        },
        occurredAt: '2026-03-09T10:10:00.000Z',
      })
    ).toMatchObject({
      entryType: 'expired',
      toStatus: 'expired',
    });
  });
});
