import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseSkillCode,
  calculateHierarchyAdjacency,
  findBestAdjacencyMatch,
  explainAdjacencyMatch,
  clearSkillCodeCache,
  ADJACENCY_FACTORS,
} from '../adjacency';

describe('Skill Adjacency', () => {
  beforeEach(() => {
    clearSkillCodeCache();
  });

  describe('parseSkillCode', () => {
    it('should parse valid skill codes', () => {
      const result = parseSkillCode('01.03.01.142');

      expect(result).not.toBeNull();
      expect(result?.l1).toBe(1);
      expect(result?.l2).toBe(3);
      expect(result?.l3).toBe(1);
      expect(result?.l4).toBe(142);
      expect(result?.code).toBe('01.03.01.142');
    });

    it('should return null for invalid codes', () => {
      expect(parseSkillCode('')).toBeNull();
      expect(parseSkillCode('invalid')).toBeNull();
      expect(parseSkillCode('01.02.03')).toBeNull(); // Missing L4
      expect(parseSkillCode('01.02.03.04.05')).toBeNull(); // Too many parts
      expect(parseSkillCode('a.b.c.d')).toBeNull(); // Non-numeric
    });

    it('should cache parsed results', () => {
      const result1 = parseSkillCode('01.03.01.142');
      const result2 = parseSkillCode('01.03.01.142');

      expect(result1).toBe(result2); // Same reference (cached)
    });
  });

  describe('calculateHierarchyAdjacency', () => {
    it('should return 1.0 for exact match', () => {
      const required = parseSkillCode('01.03.01.142')!;
      const candidate = parseSkillCode('01.03.01.142')!;

      expect(calculateHierarchyAdjacency(required, candidate)).toBe(ADJACENCY_FACTORS.EXACT_MATCH);
    });

    it('should return 0.85 for same L3 (siblings)', () => {
      const required = parseSkillCode('01.03.01.142')!;
      const candidate = parseSkillCode('01.03.01.150')!; // Same L3, different L4

      expect(calculateHierarchyAdjacency(required, candidate)).toBe(ADJACENCY_FACTORS.SAME_L3);
    });

    it('should return 0.60 for same L2 (related cluster)', () => {
      const required = parseSkillCode('01.03.01.142')!;
      const candidate = parseSkillCode('01.03.02.100')!; // Same L2, different L3

      expect(calculateHierarchyAdjacency(required, candidate)).toBe(ADJACENCY_FACTORS.SAME_L2);
    });

    it('should return 0.30 for same L1 (same domain)', () => {
      const required = parseSkillCode('01.03.01.142')!;
      const candidate = parseSkillCode('01.05.01.100')!; // Same L1, different L2

      expect(calculateHierarchyAdjacency(required, candidate)).toBe(ADJACENCY_FACTORS.SAME_L1);
    });

    it('should return 0 for different domains', () => {
      const required = parseSkillCode('01.03.01.142')!;
      const candidate = parseSkillCode('02.01.01.100')!; // Different L1

      expect(calculateHierarchyAdjacency(required, candidate)).toBe(ADJACENCY_FACTORS.NO_MATCH);
    });
  });

  describe('findBestAdjacencyMatch', () => {
    it('should find exact match', () => {
      const have = {
        '01.03.01.142': { id: '01.03.01.142', level: 4 },
        '02.01.01.100': { id: '02.01.01.100', level: 3 },
      };

      const result = findBestAdjacencyMatch('01.03.01.142', have);

      expect(result.matchType).toBe('exact');
      expect(result.factor).toBe(ADJACENCY_FACTORS.EXACT_MATCH);
      expect(result.matchedSkillId).toBe('01.03.01.142');
    });

    it('should find best sibling match', () => {
      const have = {
        '01.03.01.150': { id: '01.03.01.150', level: 4 }, // Same L3
        '01.03.02.100': { id: '01.03.02.100', level: 4 }, // Same L2
      };

      const result = findBestAdjacencyMatch('01.03.01.142', have);

      expect(result.matchType).toBe('same_l3');
      expect(result.factor).toBe(ADJACENCY_FACTORS.SAME_L3);
      expect(result.matchedSkillId).toBe('01.03.01.150');
    });

    it('should return no match for invalid skill code', () => {
      const have = {
        '01.03.01.142': { id: '01.03.01.142', level: 4 },
      };

      const result = findBestAdjacencyMatch('invalid-code', have);

      expect(result.matchType).toBe('none');
      expect(result.factor).toBe(ADJACENCY_FACTORS.NO_MATCH);
      expect(result.matchedSkillId).toBeNull();
    });

    it('should return no match when no adjacent skills exist', () => {
      const have = {
        '02.01.01.100': { id: '02.01.01.100', level: 4 }, // Different L1
      };

      const result = findBestAdjacencyMatch('01.03.01.142', have);

      expect(result.matchType).toBe('none');
      expect(result.factor).toBe(ADJACENCY_FACTORS.NO_MATCH);
    });
  });

  describe('explainAdjacencyMatch', () => {
    it('should explain exact match', () => {
      const explanation = explainAdjacencyMatch({
        requiredSkillId: '01.03.01.142',
        matchedSkillId: '01.03.01.142',
        factor: 1.0,
        matchType: 'exact',
      });

      expect(explanation).toBe('Exact skill match');
    });

    it('should explain sibling match', () => {
      const explanation = explainAdjacencyMatch({
        requiredSkillId: '01.03.01.142',
        matchedSkillId: '01.03.01.150',
        factor: 0.85,
        matchType: 'same_l3',
      });

      expect(explanation).toContain('Similar skill');
      expect(explanation).toContain('01.03.01.150');
    });

    it('should explain no match', () => {
      const explanation = explainAdjacencyMatch({
        requiredSkillId: '01.03.01.142',
        matchedSkillId: null,
        factor: 0,
        matchType: 'none',
      });

      expect(explanation).toBe('No matching skill found');
    });
  });
});
