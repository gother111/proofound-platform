import { describe, it, expect } from 'vitest';
import {
  jaccard,
  scoreValues,
  scoreCauses,
  scoreSkills,
  scoreExperience,
  scoreVerifications,
  scoreLocation,
  scoreCompensation,
  scoreLanguage,
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
    it('should use jaccard similarity', () => {
      const profile = ['collaboration', 'innovation'];
      const assignment = ['collaboration', 'sustainability'];

      // Intersection: ['collaboration'] = 1
      // Union: ['collaboration', 'innovation', 'sustainability'] = 3
      expect(scoreValues(profile, assignment)).toBeCloseTo(1 / 3);
    });
  });

  describe('scoreCauses', () => {
    it('should use jaccard similarity', () => {
      const profile = ['climate-action'];
      const assignment = ['climate-action'];

      expect(scoreCauses(profile, assignment)).toBe(1);
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
});
