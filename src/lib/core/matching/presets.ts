/**
 * Weight presets for different matching strategies.
 *
 * All weights are normalized to sum to 1.0 during composition.
 * Users can select a preset or customize weights via the UI.
 *
 * PRD Reference: Part 5 F4 - Matching Hub with configurable weights
 *
 * Key changes from legacy:
 * - Individual mission/values/causes weighting is disabled for the MVP.
 * - Recency and evidence weights carry proof quality signals.
 * - Added workAuthorization for sponsorship compatibility
 */

export interface WeightPreset {
  // Legacy purpose weights are kept for payload compatibility only.
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
  pac: number; // Disabled for individual MVP matching.
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
 * Note: legacy purpose keys remain in saved payloads for compatibility, but
 * active individual matching weights proof, skills, verification, and constraints.
 */
export const MATCH_PRESETS: Record<string, WeightPreset> = {
  /**
   * Proof-first: prioritizes proof quality, freshness, and verified fit.
   */
  'proof-first': {
    values: 0,
    causes: 0,
    skills: 0.26,
    experience: 0.12,
    verifications: 0.12,
    availability: 0.06,
    location: 0.04,
    compensation: 0.03,
    language: 0.03,
    pac: 0,
    recency: 0.16,
    evidence: 0.14,
    workAuthorization: 0.04,
  },

  /**
   * Skills emphasis: prioritizes required skills and relevant experience.
   */
  'skills-first': {
    values: 0,
    causes: 0,
    // Core weights
    skills: 0.32,
    experience: 0.16,
    verifications: 0.08,
    availability: 0.05,
    location: 0.03,
    compensation: 0.02,
    language: 0.02,
    pac: 0,
    recency: 0.13,
    evidence: 0.14,
    workAuthorization: 0.05,
  },

  /**
   * Balanced: even emphasis across proof, skills, verification, and constraints.
   * Default preset for general use cases.
   */
  balanced: {
    values: 0,
    causes: 0,
    // Core weights
    skills: 0.25,
    experience: 0.14,
    verifications: 0.1,
    availability: 0.08,
    location: 0.05,
    compensation: 0.04,
    language: 0.03,
    pac: 0,
    recency: 0.18,
    evidence: 0.09,
    workAuthorization: 0.04,
  },
};

export type PresetKey = keyof typeof MATCH_PRESETS;

const LEGACY_PRESET_ALIASES: Record<string, PresetKey> = {
  'mission-first': 'proof-first',
  'purpose-only': 'proof-first',
};

export function resolvePresetKey(key: string | null | undefined): PresetKey {
  if (!key) {
    return 'balanced';
  }

  if (key in MATCH_PRESETS) {
    return key as PresetKey;
  }

  return LEGACY_PRESET_ALIASES[key] ?? 'balanced';
}

/**
 * Get a preset by key.
 */
export function getPreset(key: string | null | undefined): WeightPreset {
  return MATCH_PRESETS[resolvePresetKey(key)];
}

/**
 * Normalize custom weights to ensure they sum to 1.0.
 * Fills in missing weights from the balanced preset.
 */
export function normalizeWeights(weights: Partial<WeightPreset>): WeightPreset {
  const activeWeights = {
    ...MATCH_PRESETS.balanced,
    ...weights,
    values: 0,
    causes: 0,
    pac: 0,
  };
  const sum = Object.values(activeWeights).reduce<number>((acc, val) => acc + (val ?? 0), 0);

  if (sum === 0) {
    return MATCH_PRESETS.balanced;
  }

  const normalizedEntries = Object.entries(activeWeights).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      acc[key] = (value ?? 0) / sum;
      return acc;
    },
    {}
  );

  return { ...MATCH_PRESETS.balanced, ...normalizedEntries } as WeightPreset;
}

/**
 * Get the disabled legacy purpose weight from a preset.
 */
export function getPACWeight(preset: WeightPreset): number {
  return preset.pac || 0;
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
 * Convert a user-facing proof-vs-skills bias slider (0-100) into normalized weights.
 * 0: skills emphasis, 50: even emphasis, 100: proof emphasis
 */
export function weightsFromProofSkillsBias(value: number): WeightPreset {
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
    MATCH_PRESETS['proof-first'],
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
