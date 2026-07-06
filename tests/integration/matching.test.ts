/** @vitest-environment node */

/**
 * Integration-level matching contract tests.
 *
 * These run without a live database so they can prove the launch matching
 * corridor's deterministic contract: hard gates, reason codes, no purpose-fit
 * scoring, stable ordering, and privacy-safe score artifacts.
 */

import { describe, expect, it } from 'vitest';

import {
  buildCanonicalMatchScoreArtifact,
  compareCanonicalMatchOrder,
  type CanonicalMatchScoreInput,
} from '@/lib/matching/match-score-contract';

const baseInput: CanonicalMatchScoreInput = {
  assignmentId: 'assignment-a',
  profileId: 'profile-a',
  assignmentOrgId: 'org-a',
  profileOrgId: 'org-b',
  assignmentStatus: 'active',
  matchabilityEligible: true,
  matchingConsentActive: true,
  policyAllowed: true,
  requiredSkills: [
    { id: 'javascript', level: 4 },
    { id: 'react', level: 4 },
  ],
  niceToHaveSkills: [{ id: 'typescript', level: 3 }],
  candidateSkills: {
    javascript: {
      level: 5,
      months: 60,
      evidenceStrength: 0.95,
      recencyMultiplier: 1,
      impactScore: 0.85,
      lastUsedAt: '2026-05-01T00:00:00.000Z',
    },
    react: {
      level: 5,
      months: 48,
      evidenceStrength: 0.9,
      recencyMultiplier: 1,
      impactScore: 0.8,
      lastUsedAt: '2026-05-01T00:00:00.000Z',
    },
    typescript: {
      level: 4,
      months: 36,
      evidenceStrength: 0.85,
      recencyMultiplier: 0.9,
      impactScore: 0.75,
      lastUsedAt: '2026-04-01T00:00:00.000Z',
    },
  },
  assignmentStartEarliest: '2026-06-01T00:00:00.000Z',
  assignmentStartLatest: '2026-07-01T00:00:00.000Z',
  profileAvailabilityEarliest: '2026-06-10T00:00:00.000Z',
  assignmentHoursMin: 30,
  assignmentHoursMax: 40,
  profileHoursMin: 30,
  profileHoursMax: 40,
  assignmentLocationMode: 'remote',
  profileWorkMode: 'remote',
  assignmentCompMin: 90_000,
  assignmentCompMax: 130_000,
  profileCompMin: 95_000,
  profileCompMax: 125_000,
  assignmentMinLanguage: { code: 'en', level: 'B2' },
  candidateLanguageLevel: 'C1',
  assignmentCanSponsorVisa: true,
  profileNeedsSponsorship: false,
  verificationGates: ['work_email', 'proof_pack'],
  verifiedFlags: {
    work_email: true,
    proof_pack: true,
  },
  assignmentValuesTags: ['climate'],
  assignmentCauseTags: ['education'],
  profileValuesTags: ['climate'],
  profileCauseTags: ['education'],
  generatedAt: new Date('2026-05-20T08:00:00.000Z'),
};

describe('matching contract integration', () => {
  it('returns a scored artifact for a qualified, consented candidate', () => {
    const artifact = buildCanonicalMatchScoreArtifact(baseInput);

    expect(artifact).not.toBeNull();
    expect(artifact?.reasonCodes).toEqual(
      expect.arrayContaining([
        'skills_strong',
        'verification_ready',
        'logistics_fit',
        'compensation_fit',
        'language_fit',
      ])
    );
    expect(artifact?.scoreTotal).toBeGreaterThan(8_000);
  });

  it('filters out assignments when required skills are not met', () => {
    const artifact = buildCanonicalMatchScoreArtifact({
      ...baseInput,
      candidateSkills: {
        javascript: baseInput.candidateSkills.javascript,
      },
    });

    expect(artifact).toBeNull();
  });

  it('keeps retired purpose fit out of scoring and reason codes', () => {
    const artifact = buildCanonicalMatchScoreArtifact({
      ...baseInput,
      assignmentValuesTags: ['perfect-purpose-match'],
      assignmentCauseTags: ['perfect-cause-match'],
      profileValuesTags: ['perfect-purpose-match'],
      profileCauseTags: ['perfect-cause-match'],
    });

    expect(artifact?.subscoresJson.purpose_fit).toBeNull();
    expect(artifact?.subscoresJson.values_fit).toBeNull();
    expect(artifact?.subscoresJson.causes_fit).toBeNull();
    expect(artifact?.reasonCodes).not.toContain('purpose_alignment_strong');
    expect(artifact?.reasonCodes).not.toContain('purpose_alignment_partial');
  });

  it('supports deterministic top-k ordering from score artifacts', () => {
    const strong = buildCanonicalMatchScoreArtifact(baseInput);
    const weaker = buildCanonicalMatchScoreArtifact({
      ...baseInput,
      assignmentId: 'assignment-b',
      candidateSkills: {
        ...baseInput.candidateSkills,
        typescript: {
          ...baseInput.candidateSkills.typescript,
          evidenceStrength: 0.1,
          recencyMultiplier: 0.3,
          impactScore: 0.2,
        },
      },
      verifiedFlags: {
        work_email: true,
        proof_pack: false,
      },
    });

    const ordered = [
      {
        counterpartId: 'assignment-b',
        scoreTotal: weaker?.scoreTotal ?? 0,
        subscoresJson: weaker?.subscoresJson ?? {},
      },
      {
        counterpartId: 'assignment-a',
        scoreTotal: strong?.scoreTotal ?? 0,
        subscoresJson: strong?.subscoresJson ?? {},
      },
    ].sort(compareCanonicalMatchOrder);

    expect(ordered.slice(0, 1).map((entry) => entry.counterpartId)).toEqual(['assignment-a']);
  });

  it('does not include organization display names in the score artifact', () => {
    const artifact = buildCanonicalMatchScoreArtifact(baseInput);
    const serialized = JSON.stringify(artifact);

    expect(serialized).toContain('org-a');
    expect(serialized).not.toContain('Test Organization');
    expect(serialized).not.toContain('Acme');
  });
});
