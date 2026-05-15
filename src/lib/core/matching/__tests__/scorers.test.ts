import { describe, it, expect } from 'vitest';
import {
  jaccard,
  scoreValues,
  scoreCauses,
  scoreSkills,
  scoreSkillsEnhanced,
  scoreExperience,
  scoreVerifications,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
  scorePAC,
  scoreRecency,
  scoreSkillsRecency,
  scoreEvidence,
  scoreSkillsEvidence,
  scoreWorkAuthorization,
  cosineSimilarity,
  composeWeighted,
  tieBreaker,
  compareMatches,
} from '../scorers';

describe('Scorers', () => {
  describe('jaccard', () => {
    it('should return 1 for identical sets', () => {
      expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1);
      expect(jaccard(['a', 'b'], ['b', 'a'])).toBe(1);
    });

    it('should return 0 for disjoint sets', () => {
      expect(jaccard(['a', 'b'], ['c', 'd'])).toBe(0);
    });

    it('should return 1 for two empty sets', () => {
      expect(jaccard([], [])).toBe(1);
    });

    it('should return 0 if one set is empty', () => {
      expect(jaccard([], ['a'])).toBe(0);
      expect(jaccard(['a'], [])).toBe(0);
    });

    it('should handle partial overlap', () => {
      // ['a', 'b'] ∩ ['b', 'c'] = ['b'] (size 1)
      // ['a', 'b'] ∪ ['b', 'c'] = ['a', 'b', 'c'] (size 3)
      expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3);
    });
  });

  describe('scoreValues', () => {
    it('is disabled for individual MVP matching', () => {
      const profile = ['collaboration', 'innovation'];
      const assignment = ['collaboration', 'sustainability'];

      expect(scoreValues(profile, assignment)).toBe(0);
    });
  });

  describe('scoreCauses', () => {
    it('is disabled for individual MVP matching', () => {
      const profile = ['climate-action'];
      const assignment = ['climate-action'];

      expect(scoreCauses(profile, assignment)).toBe(0);
    });
  });

  describe('scoreSkills', () => {
    it('should hard fail if must-have skill is missing', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave: typeof required = [];
      const have = {}; // Empty

      const result = scoreSkills(required, niceToHave, have);

      expect(result.hardFail).toBe(true);
      expect(result.score).toBe(0);
      expect(result.missing).toContain('typescript');
    });

    it('should hard fail if skill level is below required', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave: typeof required = [];
      const have = {
        typescript: { id: 'typescript', level: 2, months: 12 },
      };

      const result = scoreSkills(required, niceToHave, have);

      expect(result.hardFail).toBe(true);
      expect(result.score).toBe(0);
      expect(result.gaps).toHaveLength(1);
      expect(result.gaps[0]).toEqual({ id: 'typescript', required: 4, have: 2 });
    });

    it('should pass if all requirements are met', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave: typeof required = [];
      const have = {
        typescript: { id: 'typescript', level: 4, months: 24 },
      };

      const result = scoreSkills(required, niceToHave, have);

      expect(result.hardFail).toBe(false);
      expect(result.score).toBeGreaterThan(0);
      expect(result.missing).toHaveLength(0);
      expect(result.gaps).toHaveLength(0);
    });

    it('should give bonus for nice-to-have skills', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave = [{ id: 'react', level: 3 }];
      const have = {
        typescript: { id: 'typescript', level: 4, months: 24 },
        react: { id: 'react', level: 3, months: 12 },
      };

      const result = scoreSkills(required, niceToHave, have);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('scoreExperience', () => {
    it('should approach 1 as months increase', () => {
      expect(scoreExperience(0)).toBeLessThan(0.5);
      expect(scoreExperience(24)).toBeCloseTo(0.5, 1); // Midpoint
      expect(scoreExperience(48)).toBeGreaterThan(0.8);
      expect(scoreExperience(100)).toBeGreaterThan(0.95);
    });

    it('should return 0 for negative months', () => {
      expect(scoreExperience(-10)).toBe(0);
    });
  });

  describe('scoreVerifications', () => {
    it('should return 1 if no verifications required', () => {
      expect(scoreVerifications([], {})).toBe(1);
    });

    it('should return 1 if all required verifications are met', () => {
      const required = ['id', 'employment'];
      const have = { id: true, employment: true };

      expect(scoreVerifications(required, have)).toBe(1);
    });

    it('should return 0 if none are met', () => {
      const required = ['id', 'employment'];
      const have = { id: false, employment: false };

      expect(scoreVerifications(required, have)).toBe(0);
    });

    it('should return partial score', () => {
      const required = ['id', 'employment'];
      const have = { id: true, employment: false };

      expect(scoreVerifications(required, have)).toBe(0.5);
    });
  });

  describe('scoreLocation', () => {
    it('should return 1 for remote assignments', () => {
      expect(scoreLocation('remote', 'onsite')).toBe(1);
      expect(scoreLocation('onsite', 'remote')).toBe(1);
    });

    it('should return 1 for matching onsite locations', () => {
      expect(scoreLocation('onsite', 'onsite', 'US', 'US')).toBe(1);
    });

    it('should return 0 for mismatched onsite locations', () => {
      expect(scoreLocation('onsite', 'onsite', 'US', 'UK')).toBe(0);
    });

    it('should handle hybrid compatibility', () => {
      const score = scoreLocation('hybrid', 'hybrid');
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe('scoreCompensation', () => {
    it('should return 0 for no overlap', () => {
      const assignment = { min: 100, max: 150 };
      const candidate = { min: 200, max: 250 };

      expect(scoreCompensation(assignment, candidate)).toBe(0);
    });

    it('should return 1 for perfect overlap', () => {
      const range = { min: 100, max: 150 };

      expect(scoreCompensation(range, range)).toBe(1);
    });

    it('should return partial score for partial overlap', () => {
      const assignment = { min: 100, max: 150 };
      const candidate = { min: 120, max: 180 };

      // Overlap: 120-150 = 30
      // Candidate range: 180-120 = 60
      expect(scoreCompensation(assignment, candidate)).toBeCloseTo(0.5);
    });
  });

  describe('scoreLanguage', () => {
    it('should return 1+ for exact match or better', () => {
      expect(scoreLanguage('B2', 'B2')).toBeGreaterThanOrEqual(1);
      expect(scoreLanguage('B2', 'C1')).toBeGreaterThan(1);
    });

    it('should return 0 for below minimum', () => {
      expect(scoreLanguage('B2', 'B1')).toBe(0);
      expect(scoreLanguage('C1', 'A1')).toBe(0);
    });

    it('should handle invalid levels', () => {
      expect(scoreLanguage('X1', 'B2')).toBe(0);
      expect(scoreLanguage('B2', 'Z9')).toBe(0);
    });
  });

  describe('composeWeighted', () => {
    it('should normalize weights', () => {
      const subscores = { skills: 0.8, values: 0.6 };
      const weights = { skills: 2, values: 1 };

      const result = composeWeighted(subscores, weights);

      expect(result.normalizedWeights.skills).toBeCloseTo(2 / 3);
      expect(result.normalizedWeights.values).toBeCloseTo(1 / 3);
    });

    it('should compute weighted total', () => {
      const subscores = { skills: 0.8, values: 0.6 };
      const weights = { skills: 1, values: 1 };

      const result = composeWeighted(subscores, weights);

      // (0.8 * 0.5) + (0.6 * 0.5) = 0.7
      expect(result.total).toBeCloseTo(0.7);
    });

    it('should return contributions', () => {
      const subscores = { skills: 1.0, values: 0.5 };
      const weights = { skills: 1, values: 1 };

      const result = composeWeighted(subscores, weights);

      expect(result.contributions.skills).toBeCloseTo(0.5);
      expect(result.contributions.values).toBeCloseTo(0.25);
    });

    it('should handle zero weights with equal distribution', () => {
      const subscores = { skills: 0.8, values: 0.6 };
      const weights = { skills: 0, values: 0 };

      const result = composeWeighted(subscores, weights);

      expect(result.normalizedWeights.skills).toBeCloseTo(0.5);
      expect(result.normalizedWeights.values).toBeCloseTo(0.5);
    });
  });

  describe('tieBreaker', () => {
    it('should be deterministic', () => {
      const tie1 = tieBreaker('assignment-1', 'profile-1');
      const tie2 = tieBreaker('assignment-1', 'profile-1');

      expect(tie1).toBe(tie2);
    });

    it('should return different values for different inputs', () => {
      const tie1 = tieBreaker('assignment-1', 'profile-1');
      const tie2 = tieBreaker('assignment-1', 'profile-2');

      expect(tie1).not.toBe(tie2);
    });

    it('should return value in [0, 1)', () => {
      const tie = tieBreaker('assignment-1', 'profile-1');

      expect(tie).toBeGreaterThanOrEqual(0);
      expect(tie).toBeLessThan(1);
    });
  });

  describe('compareMatches', () => {
    it('should sort higher scores first', () => {
      const a = { score: 0.9, assignmentId: 'a1', profileId: 'p1' };
      const b = { score: 0.7, assignmentId: 'a1', profileId: 'p2' };

      expect(compareMatches(a, b)).toBe(-1);
      expect(compareMatches(b, a)).toBe(1);
    });

    it('should use tie-breaker for equal scores', () => {
      const a = { score: 0.8, assignmentId: 'a1', profileId: 'p1' };
      const b = { score: 0.8, assignmentId: 'a1', profileId: 'p2' };

      const result = compareMatches(a, b);
      expect(result).not.toBe(0);
    });

    it('should be deterministic', () => {
      const a = { score: 0.8, assignmentId: 'a1', profileId: 'p1' };
      const b = { score: 0.8, assignmentId: 'a1', profileId: 'p2' };

      const result1 = compareMatches(a, b);
      const result2 = compareMatches(a, b);

      expect(result1).toBe(result2);
    });
  });

  describe('scorePAC', () => {
    it('returns zero for legacy purpose-alignment inputs', () => {
      const result = scorePAC(
        ['innovation', 'sustainability'],
        ['climate-action'],
        ['innovation', 'collaboration'],
        ['climate-action', 'education']
      );

      expect(result.valuesScore).toBe(0);
      expect(result.causesScore).toBe(0);
      expect(result.missionVisionScore).toBe(0);
      expect(result.total).toBe(0);
    });

    it('ignores legacy purpose scores when provided', () => {
      const result = scorePAC(
        ['innovation'],
        ['climate-action'],
        ['innovation'],
        ['climate-action'],
        0.8 // missionVisionScore
      );

      expect(result.missionVisionScore).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('scoreRecency', () => {
    it('should return 1 for null/undefined (currently using)', () => {
      expect(scoreRecency(null)).toBe(1);
      expect(scoreRecency(undefined)).toBe(1);
    });

    it('should return 1 for skills used within last month', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 15); // 15 days ago

      expect(scoreRecency(recent)).toBe(1);
    });

    it('should decay over time', () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(now.getTime() - 24 * 30 * 24 * 60 * 60 * 1000);

      const score6m = scoreRecency(sixMonthsAgo);
      const score1y = scoreRecency(oneYearAgo);
      const score2y = scoreRecency(twoYearsAgo);

      // Verify decay ordering
      expect(score6m).toBeGreaterThan(score1y);
      expect(score1y).toBeGreaterThan(score2y);

      // Verify reasonable values (exponential decay with α = 0.02)
      expect(score6m).toBeGreaterThan(0.8);
      expect(score1y).toBeGreaterThan(0.7);
      expect(score2y).toBeGreaterThan(0.5);
    });

    it('should handle string dates', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 15);

      const score = scoreRecency(recent.toISOString());
      expect(score).toBe(1);
    });
  });

  describe('scoreSkillsRecency', () => {
    it('should return 1 for empty skills', () => {
      expect(scoreSkillsRecency([])).toBe(1);
    });

    it('should weight by skill level', () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 24 * 30 * 24 * 60 * 60 * 1000);

      const skills = [
        { id: 'a', level: 5, lastUsedAt: now }, // High level, recent
        { id: 'b', level: 1, lastUsedAt: oldDate }, // Low level, old
      ];

      const score = scoreSkillsRecency(skills);

      // High-level recent skill should dominate
      expect(score).toBeGreaterThan(0.9);
    });
  });

  describe('scoreEvidence', () => {
    it('should return 0.5 for null/undefined (baseline)', () => {
      expect(scoreEvidence(null as any)).toBe(0.5);
      expect(scoreEvidence(undefined)).toBe(0.5);
    });

    it('should return 0.5 for 0 evidence', () => {
      expect(scoreEvidence(0)).toBe(0.5);
    });

    it('should return 1 for perfect evidence', () => {
      expect(scoreEvidence(1)).toBe(1);
    });

    it('should scale linearly between 0.5 and 1', () => {
      expect(scoreEvidence(0.5)).toBe(0.75);
    });

    it('should clamp out-of-range values', () => {
      expect(scoreEvidence(-0.5)).toBe(0.5);
      expect(scoreEvidence(1.5)).toBe(1);
    });
  });

  describe('scoreSkillsEvidence', () => {
    it('should return 0.5 for empty skills', () => {
      expect(scoreSkillsEvidence([])).toBe(0.5);
    });

    it('should weight by skill level', () => {
      const skills = [
        { id: 'a', level: 5, evidenceStrength: 1.0 }, // High level, strong evidence
        { id: 'b', level: 1, evidenceStrength: 0.0 }, // Low level, no evidence
      ];

      const score = scoreSkillsEvidence(skills);

      // High-level skill with strong evidence should dominate
      expect(score).toBeGreaterThan(0.9);
    });
  });

  describe('scoreWorkAuthorization', () => {
    it('should return 0 when needs sponsorship but org cannot', () => {
      const score = scoreWorkAuthorization({
        candidateNeedsSponsorship: true,
        candidateWishesSponsorship: false,
        orgCanSponsor: false,
      });

      expect(score).toBe(0);
    });

    it('should return 1 when needs sponsorship and org can', () => {
      const score = scoreWorkAuthorization({
        candidateNeedsSponsorship: true,
        candidateWishesSponsorship: false,
        orgCanSponsor: true,
      });

      expect(score).toBe(1);
    });

    it('should return 0.85 when wishes sponsorship and org can', () => {
      const score = scoreWorkAuthorization({
        candidateNeedsSponsorship: false,
        candidateWishesSponsorship: true,
        orgCanSponsor: true,
      });

      expect(score).toBe(0.85);
    });

    it('should return 0.5 when wishes sponsorship but org cannot', () => {
      const score = scoreWorkAuthorization({
        candidateNeedsSponsorship: false,
        candidateWishesSponsorship: true,
        orgCanSponsor: false,
      });

      expect(score).toBe(0.5);
    });

    it('should return 1 when no sponsorship needed', () => {
      const score = scoreWorkAuthorization({
        candidateNeedsSponsorship: false,
        candidateWishesSponsorship: false,
        orgCanSponsor: false,
      });

      expect(score).toBe(1);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 0.5 for orthogonal vectors (normalized)', () => {
      // Orthogonal vectors have cosine similarity of 0
      // Normalized to [0,1] range: (0 + 1) / 2 = 0.5
      const a = [1, 0, 0];
      const b = [0, 1, 0];

      expect(cosineSimilarity(a, b)).toBeCloseTo(0.5);
    });

    it('should return 1 for identical vectors', () => {
      const v = [1, 2, 3];

      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('should return 0 for opposite vectors (normalized)', () => {
      // Opposite vectors have cosine similarity of -1
      // Normalized to [0,1] range: (-1 + 1) / 2 = 0
      const a = [1, 0, 0];
      const b = [-1, 0, 0];

      expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    });

    it('should return 0 for empty vectors', () => {
      expect(cosineSimilarity([], [])).toBe(0);
    });

    it('should return 0 for mismatched lengths', () => {
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe('scoreSkillsEnhanced', () => {
    it('should hard fail like basic scoreSkills', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave: typeof required = [];
      const have = {};

      const result = scoreSkillsEnhanced(required, niceToHave, have);

      expect(result.hardFail).toBe(true);
      expect(result.score).toBe(0);
      expect(result.weightedScore).toBe(0);
    });

    it('should include recency and evidence scores', () => {
      const now = new Date();
      const required = [{ id: 'typescript', level: 4 }];
      const niceToHave: typeof required = [];
      const have = {
        typescript: {
          id: 'typescript',
          level: 5,
          months: 24,
          evidenceStrength: 0.8,
          lastUsedAt: now,
        },
      };

      const result = scoreSkillsEnhanced(required, niceToHave, have);

      expect(result.hardFail).toBe(false);
      expect(result.recencyScore).toBeGreaterThan(0);
      expect(result.evidenceScore).toBeGreaterThan(0.5);
      expect(result.weightedScore).toBeGreaterThan(0);
    });

    it('should weight skills by evidence/recency/impact', () => {
      const required = [{ id: 'typescript', level: 4 }];
      const have = {
        typescript: {
          id: 'typescript',
          level: 4,
          evidenceStrength: 1.0,
          recencyMultiplier: 1.0,
          impactScore: 1.0,
        },
      };

      const result = scoreSkillsEnhanced(required, [], have);

      // With all factors at 1.0, weighted score should be high
      expect(result.weightedScore).toBeGreaterThan(0.9);
    });
  });
});
