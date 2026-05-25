/**
 * Skill Adjacency Scoring Module
 *
 * Provides partial credit for skills that are adjacent (similar) to required skills
 * when an exact match is not found.
 *
 * Adjacency is determined by:
 * 1. Taxonomy hierarchy (L1 > L2 > L3 > L4)
 * 2. Explicit adjacency relationships in the skill_adjacency table
 *
 * PRD Reference: Matching algorithm - skill adjacency for partial credit
 */

import { db } from '@/db';
import { skillsTaxonomy, skillAdjacency } from '@/db/schema';
import { log } from '@/lib/log';
import { eq, or, and, inArray } from 'drizzle-orm';
import { type Skill } from './scorers';

/**
 * Adjacency factors based on taxonomy hierarchy distance.
 *
 * Same L4 (exact match): 1.0
 * Same L3, different L4: 0.85 (sibling skills)
 * Same L2, different L3: 0.60 (related cluster)
 * Same L1, different L2: 0.30 (same domain)
 * Different L1: 0.0 (unrelated)
 */
export const ADJACENCY_FACTORS = {
  EXACT_MATCH: 1.0,
  SAME_L3: 0.85, // Same L3, different L4 (sibling)
  SAME_L2: 0.6, // Same L2, different L3 (related)
  SAME_L1: 0.3, // Same L1, different L2 (same domain)
  EXPLICIT_ADJACENCY: 0.75, // From adjacency table
  NO_MATCH: 0.0,
} as const;

/**
 * Parsed skill code structure
 */
interface ParsedSkillCode {
  l1: number; // Category ID
  l2: number; // Subcategory ID
  l3: number; // L3 ID
  l4: number; // Skill ID
  code: string;
}

/**
 * Adjacency match result
 */
export interface AdjacencyMatch {
  requiredSkillId: string;
  matchedSkillId: string | null;
  factor: number;
  matchType: 'exact' | 'same_l3' | 'same_l2' | 'same_l1' | 'explicit' | 'none';
}

/**
 * Cache for skill taxonomy lookups
 */
const skillCodeCache = new Map<string, ParsedSkillCode>();
const adjacencyCache = new Map<string, Map<string, number>>();

/**
 * Parse a skill code into its hierarchy components.
 *
 * Skill codes are formatted as "XX.YY.ZZ.WWW" where:
 * - XX = L1 category
 * - YY = L2 subcategory
 * - ZZ = L3
 * - WWW = L4 skill ID
 *
 * @param code Skill code (e.g., "01.03.01.142")
 * @returns Parsed components or null if invalid
 */
export function parseSkillCode(code: string): ParsedSkillCode | null {
  if (skillCodeCache.has(code)) {
    return skillCodeCache.get(code)!;
  }

  const parts = code.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const parsed: ParsedSkillCode = {
    l1: parseInt(parts[0], 10),
    l2: parseInt(parts[1], 10),
    l3: parseInt(parts[2], 10),
    l4: parseInt(parts[3], 10),
    code,
  };

  if (isNaN(parsed.l1) || isNaN(parsed.l2) || isNaN(parsed.l3) || isNaN(parsed.l4)) {
    return null;
  }

  skillCodeCache.set(code, parsed);
  return parsed;
}

/**
 * Calculate adjacency factor based on taxonomy hierarchy.
 *
 * @param required Required skill code
 * @param candidate Candidate skill code
 * @returns Adjacency factor (0-1)
 */
export function calculateHierarchyAdjacency(
  required: ParsedSkillCode,
  candidate: ParsedSkillCode
): number {
  // Exact match
  if (required.code === candidate.code) {
    return ADJACENCY_FACTORS.EXACT_MATCH;
  }

  // Same L3 (siblings)
  if (
    required.l1 === candidate.l1 &&
    required.l2 === candidate.l2 &&
    required.l3 === candidate.l3
  ) {
    return ADJACENCY_FACTORS.SAME_L3;
  }

  // Same L2 (related cluster)
  if (required.l1 === candidate.l1 && required.l2 === candidate.l2) {
    return ADJACENCY_FACTORS.SAME_L2;
  }

  // Same L1 (same domain)
  if (required.l1 === candidate.l1) {
    return ADJACENCY_FACTORS.SAME_L1;
  }

  // Different domain
  return ADJACENCY_FACTORS.NO_MATCH;
}

/**
 * Find the best adjacency match for a required skill from candidate skills.
 *
 * Uses hierarchy-based matching for quick calculations.
 * Falls back to explicit adjacency table for edge cases.
 *
 * @param requiredId Required skill ID (skill code)
 * @param candidateSkills Candidate's skills map
 * @returns Best adjacency match
 */
export function findBestAdjacencyMatch(
  requiredId: string,
  candidateSkills: Record<string, Skill>
): AdjacencyMatch {
  const requiredParsed = parseSkillCode(requiredId);

  if (!requiredParsed) {
    // Invalid skill code, can't match
    return {
      requiredSkillId: requiredId,
      matchedSkillId: null,
      factor: ADJACENCY_FACTORS.NO_MATCH,
      matchType: 'none',
    };
  }

  // Check for exact match first
  if (candidateSkills[requiredId]) {
    return {
      requiredSkillId: requiredId,
      matchedSkillId: requiredId,
      factor: ADJACENCY_FACTORS.EXACT_MATCH,
      matchType: 'exact',
    };
  }

  // Find best adjacent match from candidate skills
  let bestMatch: AdjacencyMatch = {
    requiredSkillId: requiredId,
    matchedSkillId: null,
    factor: ADJACENCY_FACTORS.NO_MATCH,
    matchType: 'none',
  };

  for (const [candidateId, candidateSkill] of Object.entries(candidateSkills)) {
    const candidateParsed = parseSkillCode(candidateId);

    if (!candidateParsed) {
      continue;
    }

    const factor = calculateHierarchyAdjacency(requiredParsed, candidateParsed);

    if (factor > bestMatch.factor) {
      let matchType: AdjacencyMatch['matchType'] = 'none';

      if (factor === ADJACENCY_FACTORS.EXACT_MATCH) matchType = 'exact';
      else if (factor === ADJACENCY_FACTORS.SAME_L3) matchType = 'same_l3';
      else if (factor === ADJACENCY_FACTORS.SAME_L2) matchType = 'same_l2';
      else if (factor === ADJACENCY_FACTORS.SAME_L1) matchType = 'same_l1';

      bestMatch = {
        requiredSkillId: requiredId,
        matchedSkillId: candidateId,
        factor,
        matchType,
      };
    }
  }

  return bestMatch;
}

/**
 * Fetch explicit adjacency relationships from the database.
 *
 * @param skillCodes Array of skill codes to fetch adjacencies for
 * @returns Map of skill code -> Map of adjacent skill code -> strength
 */
export async function fetchExplicitAdjacencies(
  skillCodes: string[]
): Promise<Map<string, Map<string, number>>> {
  if (skillCodes.length === 0) {
    return new Map();
  }

  try {
    const adjacencies = await db.query.skillAdjacency.findMany({
      where: or(
        inArray(skillAdjacency.fromCode, skillCodes),
        inArray(skillAdjacency.toCode, skillCodes)
      ),
    });

    const result = new Map<string, Map<string, number>>();

    for (const adj of adjacencies) {
      // Add both directions
      if (!result.has(adj.fromCode)) {
        result.set(adj.fromCode, new Map());
      }
      result.get(adj.fromCode)!.set(adj.toCode, parseFloat(adj.strength || '1.0'));

      if (!result.has(adj.toCode)) {
        result.set(adj.toCode, new Map());
      }
      result.get(adj.toCode)!.set(adj.fromCode, parseFloat(adj.strength || '1.0'));
    }

    return result;
  } catch (error) {
    log.error('matching.adjacency.explicit_fetch_failed', {
      skillCount: skillCodes.length,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

/**
 * Enhanced adjacency matching that includes explicit adjacency table lookups.
 *
 * @param requiredId Required skill ID
 * @param candidateSkills Candidate's skills map
 * @param explicitAdjacencies Pre-fetched explicit adjacencies
 * @returns Best adjacency match
 */
export function findBestAdjacencyMatchWithExplicit(
  requiredId: string,
  candidateSkills: Record<string, Skill>,
  explicitAdjacencies: Map<string, Map<string, number>>
): AdjacencyMatch {
  // First, check hierarchy-based match
  const hierarchyMatch = findBestAdjacencyMatch(requiredId, candidateSkills);

  // If exact match, return immediately
  if (hierarchyMatch.factor === ADJACENCY_FACTORS.EXACT_MATCH) {
    return hierarchyMatch;
  }

  // Check explicit adjacencies
  const explicitAdj = explicitAdjacencies.get(requiredId);

  if (explicitAdj) {
    for (const [adjacentCode, strength] of explicitAdj) {
      if (candidateSkills[adjacentCode]) {
        const factor = ADJACENCY_FACTORS.EXPLICIT_ADJACENCY * strength;

        if (factor > hierarchyMatch.factor) {
          return {
            requiredSkillId: requiredId,
            matchedSkillId: adjacentCode,
            factor,
            matchType: 'explicit',
          };
        }
      }
    }
  }

  return hierarchyMatch;
}

/**
 * Score skills with adjacency-based partial credit.
 *
 * This function extends the basic skill scoring to give partial credit
 * for adjacent skills when exact matches are not found.
 *
 * @param required Required skills (must-haves)
 * @param niceToHave Nice-to-have skills
 * @param have Candidate's skills map
 * @param useExplicitAdjacency Whether to check explicit adjacency table
 * @returns Skill score with adjacency matches
 */
export async function scoreSkillsWithAdjacency(
  required: Skill[],
  niceToHave: Skill[],
  have: Record<string, Skill>,
  useExplicitAdjacency: boolean = false
): Promise<{
  score: number;
  adjacencyMatches: AdjacencyMatch[];
  hardFail: boolean;
}> {
  const adjacencyMatches: AdjacencyMatch[] = [];
  let hardFail = false;

  // Fetch explicit adjacencies if needed
  let explicitAdjacencies = new Map<string, Map<string, number>>();

  if (useExplicitAdjacency) {
    const allRequiredIds = [...required.map((s) => s.id), ...niceToHave.map((s) => s.id)];
    explicitAdjacencies = await fetchExplicitAdjacencies(allRequiredIds);
  }

  // Check must-haves
  for (const req of required) {
    const match = useExplicitAdjacency
      ? findBestAdjacencyMatchWithExplicit(req.id, have, explicitAdjacencies)
      : findBestAdjacencyMatch(req.id, have);

    adjacencyMatches.push(match);

    // Hard fail if no match at all (including adjacency)
    // Note: We're more lenient here - only hard fail if factor < 0.3
    if (match.factor < ADJACENCY_FACTORS.SAME_L1) {
      hardFail = true;
    }
  }

  if (hardFail) {
    return { score: 0, adjacencyMatches, hardFail: true };
  }

  // Calculate score with adjacency factors
  let totalScore = 0;
  let maxScore = 0;

  // Must-haves (weight = 2)
  for (const req of required) {
    const match = adjacencyMatches.find((m) => m.requiredSkillId === req.id);
    const matchedSkill = match?.matchedSkillId ? have[match.matchedSkillId] : null;

    if (matchedSkill && match) {
      const levelFactor = Math.min(matchedSkill.level / Math.max(req.level, 1), 1.5);
      totalScore += levelFactor * match.factor * 2;
    }
    maxScore += 2;
  }

  // Nice-to-haves (weight = 1)
  for (const nice of niceToHave) {
    const match = useExplicitAdjacency
      ? findBestAdjacencyMatchWithExplicit(nice.id, have, explicitAdjacencies)
      : findBestAdjacencyMatch(nice.id, have);

    adjacencyMatches.push(match);

    if (match.matchedSkillId) {
      const matchedSkill = have[match.matchedSkillId];
      if (matchedSkill && matchedSkill.level >= nice.level * match.factor) {
        const levelFactor = Math.min(matchedSkill.level / Math.max(nice.level, 1), 1.5);
        totalScore += levelFactor * match.factor;
      }
    }
    maxScore += 1;
  }

  const score = maxScore > 0 ? Math.min(totalScore / maxScore, 1.0) : 1.0;

  return { score, adjacencyMatches, hardFail: false };
}

/**
 * Get human-readable adjacency explanation.
 */
export function explainAdjacencyMatch(match: AdjacencyMatch): string {
  switch (match.matchType) {
    case 'exact':
      return 'Exact skill match';
    case 'same_l3':
      return `Similar skill (same specialization): ${match.matchedSkillId}`;
    case 'same_l2':
      return `Related skill (same cluster): ${match.matchedSkillId}`;
    case 'same_l1':
      return `Domain knowledge: ${match.matchedSkillId}`;
    case 'explicit':
      return `Adjacent skill (verified): ${match.matchedSkillId}`;
    case 'none':
      return 'No matching skill found';
    default:
      return 'Unknown match type';
  }
}

/**
 * Clear the skill code cache (useful for testing).
 */
export function clearSkillCodeCache(): void {
  skillCodeCache.clear();
  adjacencyCache.clear();
}
