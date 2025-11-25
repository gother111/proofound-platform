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
  // Enhanced skill attributes for advanced scoring
  evidenceStrength?: number; // 0-1
  recencyMultiplier?: number; // 0-1
  impactScore?: number; // 0-1
  lastUsedAt?: Date | string;
}

export interface EnhancedSkillScore extends SkillScore {
  weightedScore: number; // Score weighted by evidence/recency/impact
  recencyScore: number;
  evidenceScore: number;
}

export interface PACScore {
  total: number; // 0-1 combined PAC score
  valuesScore: number;
  causesScore: number;
  missionVisionScore: number; // For semantic matching (defaults to tag-based if no embeddings)
}

export interface WorkAuthorizationParams {
  candidateNeedsSponsorship: boolean;
  candidateWishesSponsorship: boolean;
  orgCanSponsor: boolean;
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

// ============================================================================
// PAC (PURPOSE-ALIGNMENT CONTRIBUTION) SCORING
// ============================================================================

/**
 * Calculate PAC (Purpose-Alignment Contribution) score.
 *
 * PAC is a composite metric that captures how well a candidate's purpose
 * aligns with an organization's mission. It combines:
 * - Values alignment (Jaccard similarity)
 * - Causes alignment (Jaccard similarity)
 * - Mission/Vision semantic similarity (cosine, if embeddings available)
 *
 * PRD Reference: Part 2 - PAC should show ≥20% higher intro acceptance for top-decile matches
 *
 * Formula (without embeddings): PAC = 0.5 * values + 0.5 * causes
 * Formula (with embeddings): PAC = 0.4 * values + 0.3 * causes + 0.3 * missionVision
 */
export function scorePAC(
  profileValues: string[],
  profileCauses: string[],
  assignmentValues: string[],
  assignmentCauses: string[],
  missionVisionScore?: number // Optional: cosine similarity from embeddings
): PACScore {
  const valuesScore = scoreValues(profileValues, assignmentValues);
  const causesScore = scoreCauses(profileCauses, assignmentCauses);

  let total: number;

  if (missionVisionScore !== undefined && missionVisionScore >= 0) {
    // With semantic matching: 40% values, 30% causes, 30% mission/vision
    total = 0.4 * valuesScore + 0.3 * causesScore + 0.3 * missionVisionScore;
  } else {
    // Without semantic matching: 50% values, 50% causes
    total = 0.5 * valuesScore + 0.5 * causesScore;
  }

  return {
    total: Math.min(total, 1.0),
    valuesScore,
    causesScore,
    missionVisionScore: missionVisionScore ?? 0,
  };
}

/**
 * Calculate cosine similarity between two vectors.
 * Used for semantic matching of mission/vision embeddings.
 *
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns Cosine similarity in range [-1, 1], normalized to [0, 1]
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    return 0;
  }

  // Cosine similarity is [-1, 1], normalize to [0, 1]
  const similarity = dotProduct / magnitude;
  return (similarity + 1) / 2;
}

// ============================================================================
// RECENCY SCORING
// ============================================================================

/**
 * Score skill recency based on last used date.
 *
 * Uses exponential decay: recency = exp(-α * months_since_last_used)
 * Where α = 0.02 (half-life of ~35 months)
 *
 * Skills used recently score higher.
 * Ongoing skills (lastUsedAt = null or recent) get maximum score.
 *
 * @param lastUsedAt Date when skill was last used (null = currently using)
 * @param referenceDate Reference date for calculation (default: now)
 * @returns Recency multiplier in range (0, 1]
 */
export function scoreRecency(
  lastUsedAt?: Date | string | null,
  referenceDate: Date = new Date()
): number {
  // If no last used date, assume skill is current
  if (!lastUsedAt) {
    return 1.0;
  }

  const lastUsed = typeof lastUsedAt === 'string' ? new Date(lastUsedAt) : lastUsedAt;
  const monthsSinceUsed =
    (referenceDate.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // If used very recently (within 1 month), max score
  if (monthsSinceUsed <= 1) {
    return 1.0;
  }

  // Exponential decay with α = 0.02
  // This gives: 6 months = 0.89, 12 months = 0.79, 24 months = 0.62, 36 months = 0.49
  const alpha = 0.02;
  return Math.exp(-alpha * monthsSinceUsed);
}

/**
 * Calculate aggregate recency score for a set of skills.
 *
 * @param skills Array of skills with recency data
 * @returns Average recency score weighted by skill level
 */
export function scoreSkillsRecency(skills: Skill[]): number {
  if (skills.length === 0) {
    return 1.0; // No skills = neutral
  }

  let totalWeight = 0;
  let weightedRecency = 0;

  for (const skill of skills) {
    const weight = skill.level || 1;
    const recency = skill.recencyMultiplier ?? scoreRecency(skill.lastUsedAt);
    weightedRecency += recency * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedRecency / totalWeight : 1.0;
}

// ============================================================================
// EVIDENCE STRENGTH SCORING
// ============================================================================

/**
 * Score evidence strength for a skill.
 *
 * Evidence strength is a measure of how well-documented/proven a skill is:
 * - Peer attestations
 * - Employer verifications
 * - Public artifacts (GitHub, portfolio, etc.)
 * - Certifications
 *
 * @param evidenceStrength Pre-computed evidence strength (0-1)
 * @returns Evidence score in range [0.5, 1.0] (baseline of 0.5 for no evidence)
 */
export function scoreEvidence(evidenceStrength?: number): number {
  if (evidenceStrength === undefined || evidenceStrength === null) {
    return 0.5; // Neutral baseline for unverified skills
  }

  // Ensure in valid range
  const normalized = Math.max(0, Math.min(1, evidenceStrength));

  // Scale from [0,1] to [0.5, 1.0] - even unproven skills get some credit
  return 0.5 + 0.5 * normalized;
}

/**
 * Calculate aggregate evidence score for a set of skills.
 */
export function scoreSkillsEvidence(skills: Skill[]): number {
  if (skills.length === 0) {
    return 0.5;
  }

  let totalWeight = 0;
  let weightedEvidence = 0;

  for (const skill of skills) {
    const weight = skill.level || 1;
    const evidence = scoreEvidence(skill.evidenceStrength);
    weightedEvidence += evidence * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedEvidence / totalWeight : 0.5;
}

// ============================================================================
// WORK AUTHORIZATION SCORING
// ============================================================================

/**
 * Score work authorization compatibility.
 *
 * Scoring logic (from PRD):
 * - Candidate needs sponsorship & org can't sponsor → 0 (hard fail)
 * - Candidate needs sponsorship & org can sponsor → 1.0 (perfect match)
 * - Candidate wishes sponsorship & org can sponsor → 0.85 (good match)
 * - Candidate wishes sponsorship & org can't sponsor → 0.5 (partial match)
 * - No sponsorship needed → 1.0 (no constraint)
 */
export function scoreWorkAuthorization(params: WorkAuthorizationParams): number {
  const { candidateNeedsSponsorship, candidateWishesSponsorship, orgCanSponsor } = params;

  // Hard requirement: candidate NEEDS sponsorship
  if (candidateNeedsSponsorship) {
    return orgCanSponsor ? 1.0 : 0; // Hard fail if org can't sponsor
  }

  // Soft preference: candidate WISHES sponsorship (nice-to-have)
  if (candidateWishesSponsorship) {
    return orgCanSponsor ? 0.85 : 0.5; // Reduced score but not blocking
  }

  // No sponsorship needed - perfect match
  return 1.0;
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
 * Enhanced skills scoring with evidence, recency, and impact factors.
 *
 * This function extends basic skill matching with additional quality signals:
 * - Evidence strength: How well-documented is the skill?
 * - Recency: How recently was the skill used?
 * - Impact: What outcomes has the candidate achieved with this skill?
 *
 * Formula per skill:
 *   skillWeight = levelFactor * evidenceFactor * recencyFactor * (0.5 + 0.5 * impactScore)
 *
 * PRD Reference: Proofound_Matching_Conversation.md - Stage-2 re-rank
 */
export function scoreSkillsEnhanced(
  required: Skill[],
  niceToHave: Skill[],
  have: Record<string, Skill>
): EnhancedSkillScore {
  const baseScore = scoreSkills(required, niceToHave, have);

  if (baseScore.hardFail) {
    return {
      ...baseScore,
      weightedScore: 0,
      recencyScore: 0,
      evidenceScore: 0,
    };
  }

  // Collect all candidate skills that matched
  const matchedSkills: Skill[] = [];
  for (const req of required) {
    const candidate = have[req.id];
    if (candidate) {
      matchedSkills.push(candidate);
    }
  }
  for (const nice of niceToHave) {
    const candidate = have[nice.id];
    if (candidate && candidate.level >= nice.level) {
      matchedSkills.push(candidate);
    }
  }

  // Calculate aggregate recency and evidence scores
  const recencyScore = scoreSkillsRecency(matchedSkills);
  const evidenceScore = scoreSkillsEvidence(matchedSkills);

  // Calculate weighted score incorporating all factors
  let weightedTotal = 0;
  let maxWeight = 0;

  // Must-haves (weight = 2)
  for (const req of required) {
    const candidate = have[req.id];
    if (candidate) {
      const levelFactor = Math.min(candidate.level / Math.max(req.level, 1), 1.5);
      const recency = candidate.recencyMultiplier ?? scoreRecency(candidate.lastUsedAt);
      const evidence = scoreEvidence(candidate.evidenceStrength);
      const impact = candidate.impactScore ?? 0;

      // Combined factor: level * evidence * recency * (0.5 + 0.5 * impact)
      const combinedFactor = levelFactor * evidence * recency * (0.5 + 0.5 * impact);
      weightedTotal += combinedFactor * 2;
      maxWeight += 2;
    }
  }

  // Nice-to-haves (weight = 1)
  for (const nice of niceToHave) {
    const candidate = have[nice.id];
    if (candidate && candidate.level >= nice.level) {
      const levelFactor = Math.min(candidate.level / Math.max(nice.level, 1), 1.5);
      const recency = candidate.recencyMultiplier ?? scoreRecency(candidate.lastUsedAt);
      const evidence = scoreEvidence(candidate.evidenceStrength);
      const impact = candidate.impactScore ?? 0;

      const combinedFactor = levelFactor * evidence * recency * (0.5 + 0.5 * impact);
      weightedTotal += combinedFactor;
      maxWeight += 1;
    }
  }

  const weightedScore = maxWeight > 0 ? Math.min(weightedTotal / maxWeight, 1.0) : 1.0;

  return {
    ...baseScore,
    weightedScore,
    recencyScore,
    evidenceScore,
  };
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
