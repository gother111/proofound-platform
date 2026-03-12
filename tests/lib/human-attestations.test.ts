import { describe, expect, it } from 'vitest';

import {
  MAX_SKILLS_PER_ATTESTATION,
  applySkillVerificationTrustLift,
  deriveAttestationRequestMode,
  parseHumanObservedAttestationResponse,
} from '@/lib/verification/human-attestations';

describe('human-observed attestation policy', () => {
  it('creates attestation mode only for bounded eligible interpersonal skills', () => {
    const mode = deriveAttestationRequestMode({
      skills: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          label: 'Communication',
          skillCode: 'u-communication',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          label: 'Collaboration',
          skillCode: 'u-collaboration',
        },
      ],
      totalArtifacts: 2,
    });

    expect(mode).toMatchObject({
      requestKind: 'human_observed_attestation',
      requestPayload: {
        skillLabels: ['Communication', 'Collaboration'],
      },
    });
  });

  it('rejects attestation bundles above the maximum skill limit', () => {
    const mode = deriveAttestationRequestMode({
      skills: Array.from({ length: MAX_SKILLS_PER_ATTESTATION + 1 }, (_, index) => ({
        id: `${index + 1}`.padStart(8, '0') + '-1111-4111-8111-111111111111',
        label: `Communication ${index + 1}`,
        skillCode: 'u-communication',
      })),
      totalArtifacts: MAX_SKILLS_PER_ATTESTATION + 1,
    });

    expect(mode.requestKind).toBe('generic_verification');
    expect('error' in mode ? mode.error : null).toContain(`${MAX_SKILLS_PER_ATTESTATION} skills`);
  });

  it('requires exact structured attestation fields and requested skill ids', () => {
    const requestMode = deriveAttestationRequestMode({
      skills: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          label: 'Leadership',
          skillCode: 'u-leadership',
        },
      ],
      totalArtifacts: 1,
    });

    if (requestMode.requestKind !== 'human_observed_attestation') {
      throw new Error('Expected attestation mode');
    }

    const valid = parseHumanObservedAttestationResponse(
      {
        verifierIdentityReference: 'Taylor, engineering lead',
        relationshipToUser: 'Manager',
        observationContext: 'Observed during two product launches.',
        observationDuration: '8 months',
        lastObservedAt: '2026-02',
        skillIds: ['11111111-1111-4111-8111-111111111111'],
        observedBehaviors: ['Ran clear retrospectives', 'Resolved conflicts early'],
        confidenceLevel: 'high',
        conflictBiasDisclosure: 'Direct manager for one quarter.',
      },
      requestMode.requestPayload
    );

    expect(valid.success).toBe(true);

    const invalid = parseHumanObservedAttestationResponse(
      {
        verifierIdentityReference: 'Taylor',
        relationshipToUser: 'Manager',
        observationContext: 'Observed during launches.',
        observationDuration: '8 months',
        lastObservedAt: '2026-02',
        skillIds: ['33333333-3333-4333-8333-333333333333'],
        observedBehaviors: ['Led clearly'],
        confidenceLevel: 'high',
        conflictBiasDisclosure: 'Direct manager.',
      },
      requestMode.requestPayload
    );

    expect(invalid.success).toBe(false);
  });

  it('keeps structured attestation trust lift below generic verification lift', () => {
    expect(
      applySkillVerificationTrustLift({
        currentStrength: 0.3,
        requestKind: 'human_observed_attestation',
        integrityStatus: 'clear',
        status: 'accepted',
        attestationResponse: {
          verifierIdentityReference: 'Taylor',
          relationshipToUser: 'Manager',
          observationContext: 'Observed during launches.',
          observationDuration: '8 months',
          lastObservedAt: '2026-02',
          skillIds: ['11111111-1111-4111-8111-111111111111'],
          observedBehaviors: ['Ran clear retrospectives'],
          confidenceLevel: 'high',
          conflictBiasDisclosure: 'Direct manager.',
        },
      })
    ).toBe(0.4);

    expect(
      applySkillVerificationTrustLift({
        currentStrength: 0.3,
        requestKind: 'generic_verification',
        integrityStatus: 'clear',
        status: 'accepted',
        attestationResponse: null,
      })
    ).toBe(0.5);
  });
});
