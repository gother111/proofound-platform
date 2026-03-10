import { describe, expect, it } from 'vitest';

import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';

const baseAssignment = {
  builderMode: 'basic',
  role: 'Product Designer',
  businessValue: 'Improve candidate quality',
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

  it('requires weight totals only in advanced mode', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
        ...baseAssignment,
        builderMode: 'advanced',
        mustHaveSkills: ['Research'],
        weights: { mission: 50, expertise: 30, workMode: 10 },
      },
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.builderMode).toBe('advanced');
    expect(result.blocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ blockCode: 'weights_required' })])
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
});
