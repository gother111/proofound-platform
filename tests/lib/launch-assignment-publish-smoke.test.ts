import { describe, expect, it } from 'vitest';

import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';

describe('launch assignment publish smoke', () => {
  it('keeps a canonical MVP assignment publishable when proof-backed requirements are present', () => {
    const result = validateAssignmentPublishReadiness({
      assignment: {
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
      } as any,
      outcomesCount: 1,
      assignmentBasicModeEnabled: true,
      organization: {
        trustStatus: 'platform_reviewed',
        orgTrustTier: 'reviewed',
        verified: true,
      } as any,
    });

    expect(result.canPublish).toBe(true);
    expect(result.blocks).toEqual([]);
  });
});
