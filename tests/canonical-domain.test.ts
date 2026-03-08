/** @vitest-environment node */

import { describe, expect, it } from 'vitest';

import {
  mapLegacyOrganizationVisibility,
  mapLegacyProfileVisibility,
  mapLegacyProofVisibility,
} from '@/lib/contracts/canonical-domain';
import { buildMatchAuditFields, CANONICAL_MATCH_SCORE_VERSION } from '@/lib/canonical/repository';

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
