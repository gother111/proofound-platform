/**
 * Weight presets for different matching strategies.
 *
 * All weights are normalized to sum to 1.0 during composition.
 * Users can select a preset or customize weights via the UI.
 *
 * PRD Reference: Part 5 F4 - Matching Hub with configurable weights
 *
 * Key changes from legacy:
 * - PAC (Purpose-Alignment Contribution) replaces separate values/causes weights
 * - Added recency and evidence weights for skill quality signals
 * - Added workAuthorization for sponsorship compatibility
 */

export interface WeightPreset {
  // Legacy weights (kept for backward compatibility)
  values: number;
  causes: number;
  // Core matching weights
  skills: number;
  experience: number;
  verifications: number;
  availability: number;
  location: number;
  compensation: number;
  language: number;
  // New PRD-aligned weights
  pac: number; // Purpose-Alignment Contribution (combines values + causes + mission/vision)
  recency: number; // Skill recency factor
  evidence: number; // Evidence strength factor
  workAuthorization: number; // Work authorization compatibility
  [key: string]: number;
}

/**
 * Default weights for each preset.
 *
 * Total weights sum to 1.0 for each preset.
 *
 * Note: PAC is the primary purpose metric. Values and causes are kept
 * for backward compatibility but PAC should be used for new matching.
 */
export const MATCH_PRESETS: Record<string, WeightPreset> = {
  /**
   * Mission-First: Prioritizes purpose alignment over skills.
   * Best for impact-focused roles, NGOs, and values-driven organizations.
   */
  'mission-first': {
    // Legacy (sum to 0.60 of purpose weight)
    values: 0.2,
    causes: 0.15,
    // Core weights
    skills: 0.18,
    experience: 0.08,
    verifications: 0.03,
    availability: 0.02,
    location: 0.02,
    compensation: 0.02,
    language: 0.01,
    // New PRD weights
    pac: 0.35, // High PAC weight for mission-first
    recency: 0.05,
    evidence: 0.05,
    workAuthorization: 0.04,
  },

  /**
   * Skills-First: Prioritizes technical skills and experience.
   * Best for technical roles requiring specific expertise.
   */
  'skills-first': {
    // Legacy (lower purpose weight)
    values: 0.06,
    causes: 0.04,
    // Core weights
    skills: 0.35,
    experience: 0.18,
    verifications: 0.08,
    availability: 0.05,
    location: 0.03,
    compensation: 0.02,
    language: 0.02,
    // New PRD weights
    pac: 0.1, // Lower PAC weight for skills-first
    recency: 0.1,
    evidence: 0.12,
    workAuthorization: 0.05,
  },

  /**
   * Balanced: Equal consideration of purpose and skills.
   * Default preset for general use cases.
   */
  balanced: {
    // Legacy
    values: 0.12,
    causes: 0.08,
    // Core weights
    skills: 0.22,
    experience: 0.12,
    verifications: 0.06,
    availability: 0.06,
    location: 0.04,
    compensation: 0.03,
    language: 0.02,
    // New PRD weights
    pac: 0.2, // Moderate PAC weight
    recency: 0.08,
    evidence: 0.08,
    workAuthorization: 0.04,
  },

  /**
   * Purpose-Only: Maximum PAC weight for mission-critical matching.
   * Use when cultural fit and values alignment are paramount.
   */
  'purpose-only': {
    values: 0.25,
    causes: 0.2,
    skills: 0.08,
    experience: 0.05,
    verifications: 0.02,
    availability: 0.02,
    location: 0.02,
    compensation: 0.01,
    language: 0.01,
    pac: 0.45, // Maximum PAC weight
    recency: 0.03,
    evidence: 0.03,
    workAuthorization: 0.03,
  },
};

export type PresetKey = keyof typeof MATCH_PRESETS;

/**
 * Get a preset by key.
 */
export function getPreset(key: PresetKey): WeightPreset {
  return MATCH_PRESETS[key] || MATCH_PRESETS.balanced;
}

/**
 * Normalize custom weights to ensure they sum to 1.0.
 * Fills in missing weights from the balanced preset.
 */
export function normalizeWeights(weights: Partial<WeightPreset>): WeightPreset {
  const sum = Object.values(weights).reduce<number>((acc, val) => acc + (val ?? 0), 0);

  if (sum === 0) {
    return MATCH_PRESETS.balanced;
  }

  const normalizedEntries = Object.entries(weights).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      acc[key] = (value ?? 0) / sum;
      return acc;
    },
    {}
  );

  return { ...MATCH_PRESETS.balanced, ...normalizedEntries } as WeightPreset;
}

/**
 * Get the PAC (Purpose-Alignment Contribution) weight from a preset.
 * This is the combined weight for all purpose-related scoring.
 */
export function getPACWeight(preset: WeightPreset): number {
  // If pac weight exists, use it; otherwise combine values + causes
  if (preset.pac > 0) {
    return preset.pac;
  }
  return (preset.values || 0) + (preset.causes || 0);
}

/**
 * Get the skills/competency weight from a preset.
 * Includes skills, experience, recency, and evidence.
 */
export function getSkillsWeight(preset: WeightPreset): number {
  return (
    (preset.skills || 0) + (preset.experience || 0) + (preset.recency || 0) + (preset.evidence || 0)
  );
}

/**
 * Get the constraints/logistics weight from a preset.
 * Includes availability, location, compensation, language, work authorization.
 */
export function getConstraintsWeight(preset: WeightPreset): number {
  return (
    (preset.availability || 0) +
    (preset.location || 0) +
    (preset.compensation || 0) +
    (preset.language || 0) +
    (preset.workAuthorization || 0)
  );
}

function normalizeStrictWeights(weights: Record<string, number>): WeightPreset {
  const clampedEntries = Object.entries(weights).map(
    ([key, value]) => [key, Math.max(0, value)] as const
  );
  const sum = clampedEntries.reduce((acc, [, value]) => acc + value, 0);

  if (sum <= 0) {
    return MATCH_PRESETS.balanced;
  }

  const normalized = Object.fromEntries(
    clampedEntries.map(([key, value]) => [key, value / sum])
  ) as WeightPreset;

  return normalized;
}

function interpolateWeights(from: WeightPreset, to: WeightPreset, ratio: number): WeightPreset {
  const t = Math.max(0, Math.min(1, ratio));
  const keys = new Set([...Object.keys(from), ...Object.keys(to)]);
  const interpolated: Record<string, number> = {};

  keys.forEach((key) => {
    const start = from[key] ?? 0;
    const end = to[key] ?? 0;
    interpolated[key] = start + (end - start) * t;
  });

  return normalizeStrictWeights(interpolated);
}

/**
 * Convert a user-facing mission-vs-skills bias slider (0-100) into normalized weights.
 * 0: skills-first, 50: balanced, 100: mission-first
 */
export function weightsFromMissionSkillsBias(value: number): WeightPreset {
  const clampedValue = Math.max(0, Math.min(100, value));

  if (clampedValue <= 50) {
    return interpolateWeights(
      MATCH_PRESETS['skills-first'],
      MATCH_PRESETS.balanced,
      clampedValue / 50
    );
  }

  return interpolateWeights(
    MATCH_PRESETS.balanced,
    MATCH_PRESETS['mission-first'],
    (clampedValue - 50) / 50
  );
}

export function getWeightBiasBucket(value: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  if (clamped <= 20) return '0-20';
  if (clamped <= 40) return '21-40';
  if (clamped <= 60) return '41-60';
  if (clamped <= 80) return '61-80';
  return '81-100';
}
