import { describe, expect, it } from 'vitest';

import { extractAssignmentDraftFromJobDescription } from '@/lib/assignments/job-description-import';

const FULL_JOB_DESCRIPTION = `
Title: Partner Launch Operations Lead

About the role:
We need this person to make partner onboarding reliable before the first pilot expansion. The role exists to turn vague launch requests into a repeatable proof-backed operating cadence.

Responsibilities:
- Own partner onboarding runbooks and launch readiness reviews.
- Coordinate product, support, and founder updates every week.
- Improve the handoff from signed partner to live proof review.

Outcomes:
- Launch the first three partners with clean readiness evidence within 90 days.
- Reduce manual launch follow-up by half within 6 months.

Requirements:
- Partner operations
- Program management
- SaaS implementation

Preferred:
- Startup customer success

Proof:
Portfolio examples should show comparable rollout ownership, stakeholder coordination, and measured launch outcomes.

Location: Stockholm, Sweden
Compensation: USD 80000 - 110000
Full-time
`;

describe('job description assignment import', () => {
  it('rejects empty and very short source text with guidance', () => {
    const result = extractAssignmentDraftFromJobDescription('Need an operator.');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/too short/i);
      expect(result.guidance.join(' ')).toMatch(/full assignment brief/i);
      expect(result.guidance.join(' ')).not.toMatch(/full job description/i);
    }
  });

  it('extracts a structured assignment draft from a long-form JD', () => {
    const result = extractAssignmentDraftFromJobDescription(FULL_JOB_DESCRIPTION);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.draft.role).toBe('Partner Launch Operations Lead');
    expect(result.draft.engagementType).toBe('full_time');
    expect(result.draft.businessValue).toContain('partner onboarding reliable');
    expect(result.draft.description).toContain('Own partner onboarding runbooks');
    expect(result.draft.description).not.toBe(FULL_JOB_DESCRIPTION);
    expect(result.draft.expectedImpact).toContain('Portfolio examples');
    expect(result.draft.outcomes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: 'Launch the first three partners with clean readiness evidence within 90 days',
          timeframe: '90d',
        }),
        expect.objectContaining({
          metric: 'Reduce manual launch follow-up by half within 6 months',
          timeframe: '6mo',
        }),
      ])
    );
    expect(result.draft.mustHaveSkills.map((skill) => skill.label)).toEqual([
      'Partner operations',
      'Program management',
      'SaaS implementation',
    ]);
    expect(result.draft.niceToHaveSkills.map((skill) => skill.label)).toEqual([
      'Startup customer success',
    ]);
    expect(result.draft.locationMode).toBe('hybrid');
    expect(result.draft.city).toBe('Stockholm');
    expect(result.draft.country).toBe('Sweden');
    expect(result.draft.compMin).toBe(80000);
    expect(result.draft.compMax).toBe(110000);
    expect(result.draft.missingFields).toEqual([]);
  });
});
