/**
 * Pure, deterministic scoring functions for matching.
 *
 * All functions return scores in the range [0, 1].
 * Deterministic: same inputs always produce same outputs.
 * No side effects, no external dependencies.
 */

import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface Skill {
  id: string;
  level: number; // 0-5
  months?: number;
}

export interface SkillScore {
  score: number; // 0-1
  gaps: Array<{ id: string; required: number; have: number }>;
  missing: string[];
  hardFail: boolean;
}

export interface DateWindow {
  earliest: Date;
  latest: Date;
}

export interface Range {
  min: number;
  max: number;
}

export interface ComposedScore {
  total: number;
  normalizedWeights: Record<string, number>;
  contributions: Record<string, number>; // Each class's contribution to total
}

export type LocationMode = 'remote' | 'onsite' | 'hybrid';

// ============================================================================
// SET OPERATIONS
// ============================================================================

/**
 * Jaccard similarity: intersection / union
 * Returns 0-1 similarity between two string arrays.
 */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) {
    return 1.0; // Both empty = perfect match
  }
  if (a.length === 0 || b.length === 0) {
    return 0.0;
  }

  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

// ============================================================================
// DOMAIN SCORING FUNCTIONS
// ============================================================================

/**
 * Score values alignment (mission fit)
 */
export function scoreValues(profileValues: string[], assignmentValues: string[]): number {
  return jaccard(profileValues, assignmentValues);
}

/**
 * Score causes alignment (impact focus)
 */
export function scoreCauses(profileCauses: string[], assignmentCauses: string[]): number {
  return jaccard(profileCauses, assignmentCauses);
}

/**
 * Score skills match with hard filters.
 *
 * Hard fail if:
 * - Any must-have skill is missing
 * - Any must-have skill level is below required
 *
 * Otherwise, score based on:
 * - Level match quality
 * - Nice-to-have bonuses
 */
export function scoreSkills(
  required: Skill[],
  niceToHave: Skill[],
  have: Record<string, Skill>
): SkillScore {
  const gaps: Array<{ id: string; required: number; have: number }> = [];
  const missing: string[] = [];
  let hardFail = false;

  // Check must-haves
  for (const req of required) {
    const candidate = have[req.id];

    if (!candidate) {
      missing.push(req.id);
      hardFail = true;
    } else if (candidate.level < req.level) {
      gaps.push({ id: req.id, required: req.level, have: candidate.level });
      hardFail = true;
    }
  }

  if (hardFail) {
    return { score: 0, gaps, missing, hardFail: true };
  }

  // Compute score based on quality of matches
  let totalScore = 0;
  let maxScore = 0;

  // Must-haves (weight = 2)
  for (const req of required) {
    const candidate = have[req.id]!;
    const levelMatch = Math.min(candidate.level / Math.max(req.level, 1), 1.5); // Bonus for exceeding
    totalScore += levelMatch * 2;
    maxScore += 2;
  }

  // Nice-to-haves (weight = 1)
  for (const nice of niceToHave) {
    const candidate = have[nice.id];
    if (candidate && candidate.level >= nice.level) {
      const levelMatch = Math.min(candidate.level / Math.max(nice.level, 1), 1.5);
      totalScore += levelMatch;
    }
    maxScore += 1;
  }

  const score = maxScore > 0 ? Math.min(totalScore / maxScore, 1.0) : 1.0;

  return { score, gaps, missing, hardFail: false };
}

/**
 * Score experience (months on required skills).
 *
 * Logistic curve: approaches 1 as months → ∞
 * Midpoint: 24 months (2 years)
 * Steepness: k = 0.08
 */
export function scoreExperience(months: number): number {
  if (months < 0) return 0;

  const k = 0.08;
  const m0 = 24; // Midpoint

  return 1 / (1 + Math.exp(-k * (months - m0)));
}

/**
 * Score verifications (binary pass/fail for required gates)
 */
export function scoreVerifications(required: string[], have: Record<string, boolean>): number {
  if (required.length === 0) {
    return 1.0; // No requirements = perfect score
  }

  const passed = required.filter((req) => have[req] === true).length;
  return passed / required.length;
}

/**
 * Score availability (date window overlap + hours compatibility)
 */
export function scoreAvailability(
  assignmentWindow: DateWindow,
  candidateStart: Date,
  assignmentHours: Range,
  candidateHours: Range
): number {
  // Check date overlap
  const candidateTime = candidateStart.getTime();
  const earliestTime = assignmentWindow.earliest.getTime();
  const latestTime = assignmentWindow.latest.getTime();

  if (candidateTime < earliestTime || candidateTime > latestTime) {
    return 0; // No overlap
  }

  // Check hours overlap
  const hoursOverlapMin = Math.max(assignmentHours.min, candidateHours.min);
  const hoursOverlapMax = Math.min(assignmentHours.max, candidateHours.max);

  if (hoursOverlapMin > hoursOverlapMax) {
    return 0; // No hours compatibility
  }

  // Score based on how well they align
  const dateScore = 1.0 - Math.abs(candidateTime - earliestTime) / (latestTime - earliestTime + 1);
  const hoursOverlap = hoursOverlapMax - hoursOverlapMin;
  const hoursUnion =
    Math.max(assignmentHours.max, candidateHours.max) -
    Math.min(assignmentHours.min, candidateHours.min);
  const hoursScore = hoursOverlap / Math.max(hoursUnion, 1);

  return (dateScore + hoursScore) / 2;
}

/**
 * Score location compatibility
 */
export function scoreLocation(
  assignmentMode: LocationMode,
  candidateMode: LocationMode,
  assignmentCountry?: string,
  candidateCountry?: string
): number {
  // Remote is compatible with everything
  if (assignmentMode === 'remote' || candidateMode === 'remote') {
    return 1.0;
  }

  // Hybrid is compatible with hybrid and onsite
  if (assignmentMode === 'hybrid' && (candidateMode === 'hybrid' || candidateMode === 'onsite')) {
    return 0.9;
  }

  if (candidateMode === 'hybrid' && assignmentMode === 'onsite') {
    return 0.9;
  }

  // Onsite requires country match
  if (assignmentMode === 'onsite' && candidateMode === 'onsite') {
    if (!assignmentCountry || !candidateCountry) {
      return 0.5; // Unknown location
    }
    return assignmentCountry === candidateCountry ? 1.0 : 0.0;
  }

  return 0.5; // Partial compatibility
}

/**
 * Score compensation compatibility (range overlap)
 */
export function scoreCompensation(assignmentRange: Range, candidateRange: Range): number {
  const overlapMin = Math.max(assignmentRange.min, candidateRange.min);
  const overlapMax = Math.min(assignmentRange.max, candidateRange.max);

  if (overlapMin > overlapMax) {
    return 0; // No overlap
  }

  const overlapSize = overlapMax - overlapMin;
  const candidateSize = candidateRange.max - candidateRange.min;

  return Math.min(overlapSize / Math.max(candidateSize, 1), 1.0);
}

/**
 * Score language proficiency (CEFR levels)
 *
 * A1 < A2 < B1 < B2 < C1 < C2
 */
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function scoreLanguage(minCEFR: string, candidateCEFR: string): number {
  const minIndex = CEFR_ORDER.indexOf(minCEFR);
  const candidateIndex = CEFR_ORDER.indexOf(candidateCEFR);

  if (minIndex === -1 || candidateIndex === -1) {
    return 0; // Invalid levels
  }

  if (candidateIndex < minIndex) {
    return 0; // Below minimum
  }

  // Perfect if exact match, bonus for exceeding
  const delta = candidateIndex - minIndex;
  return Math.min(1.0 + delta * 0.1, 1.5);
}

// ============================================================================
// COMPOSITION
// ============================================================================

/**
 * Compose weighted subscores into final score.
 *
 * Normalizes weights to sum to 1.0.
 * Returns total score and per-class contributions.
 */
export function composeWeighted(
  subscores: Record<string, number>,
  weights: Record<string, number>
): ComposedScore {
  // Normalize weights
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights: Record<string, number> = {};

  if (weightSum === 0) {
    // Equal weights if all zero
    const numScores = Object.keys(subscores).length;
    const equalWeight = 1 / numScores;
    for (const key of Object.keys(subscores)) {
      normalizedWeights[key] = equalWeight;
    }
  } else {
    for (const [key, weight] of Object.entries(weights)) {
      normalizedWeights[key] = weight / weightSum;
    }
  }

  // Compute weighted sum
  let total = 0;
  const contributions: Record<string, number> = {};

  for (const [key, score] of Object.entries(subscores)) {
    const weight = normalizedWeights[key] || 0;
    const contribution = score * weight;
    contributions[key] = contribution;
    total += contribution;
  }

  return {
    total: Math.min(total, 1.0), // Cap at 1.0
    normalizedWeights,
    contributions,
  };
}

// ============================================================================
// TIE-BREAKING
// ============================================================================

/**
 * Stable tie-breaker using hash of IDs.
 * Ensures deterministic ordering for same-score matches.
 */
export function tieBreaker(assignmentId: string, profileId: string): number {
  const hash = crypto.createHash('sha256').update(`${assignmentId}:${profileId}`).digest('hex');

  // Convert first 8 hex chars to number in [0, 1)
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}

/**
 * Compare two matches with tie-breaking.
 * Returns -1 if a < b, 1 if a > b, 0 if equal.
 */
export function compareMatches(
  a: { score: number; assignmentId: string; profileId: string },
  b: { score: number; assignmentId: string; profileId: string }
): number {
  // Higher scores first
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;

  // Tie-break with stable hash
  const tieA = tieBreaker(a.assignmentId, a.profileId);
  const tieB = tieBreaker(b.assignmentId, b.profileId);

  return tieA - tieB;
}
