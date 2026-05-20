import { describe, expect, it } from 'vitest';

import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';

const baseAssignment = {
  builderMode: 'basic',
  role: 'Product Designer',
  businessValue:
    'Improve candidate quality by turning vague hiring goals into specific proof-backed review decisions.',
  description:
    'Own the end-to-end assignment review loop, clarify what work is expected, and keep the team aligned on what delivery actually matters.',
  expectedImpact:
    'Convincing proof includes delivered assignments, clear evidence of ownership, and signals that the candidate can explain tradeoffs from real work.',
  mustHaveSkills: ['Research', 'UX', 'Figma'],
  locationMode: 'remote',
  city: null,
  country: null,
  compMin: 80000,
  compMax: 100000,
  verificationGates: [],
  weights: null,
} as any;

describe('validateAssignmentPublishReadiness', () => {
  it('treats missing builder mode as basic when basic mode is enabled', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        builderMode: null,
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.builderMode).toBe('basic');
    expect(result.canPublish).toBe(true);
  });

  it('requires three must-have skills in basic mode', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        mustHaveSkills: ['Research', 'UX'],
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.canPublish).toBe(false);
    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockCode: 'must_have_skills_minimum_basic' }),
      ])
    );
  });

  it('requires concrete work summary and proof expectations', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        description: '',
        expectedImpact: '',
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockCode: 'work_summary_required', field: 'description' }),
        expect.objectContaining({
          blockCode: 'proof_expectations_required',
          field: 'proofExpectations',
        }),
      ])
    );
  });

  it('returns invalid trust requirement block reasons when gates are unsupported', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        verificationGates: ['identity', 'unknown_gate'],
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'unverified',
        orgTrustTier: 'restricted',
        verified: false,
      } as any,
    });

    expect(result.blocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ blockCode: 'invalid_trust_requirements' })])
    );
  });

  it('blocks LinkedIn employment checks as non-launch assignment trust gates', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        verificationGates: ['linkedin'],
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'verified',
        orgTrustTier: 'trusted',
        verified: true,
      } as any,
    });

    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'invalid_trust_requirements',
          details: { invalidGates: ['linkedin'] },
        }),
      ])
    );
  });

  it('blocks vague generic assignment language at publish time', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        businessValue: 'Join our team and make an impact.',
        description: 'Wear many hats on a fast-paced team.',
        expectedImpact: 'Self-starter wanted.',
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'rolePurpose',
        }),
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'description',
        }),
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'proofExpectations',
        }),
      ])
    );
  });
});
