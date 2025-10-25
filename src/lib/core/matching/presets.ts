/**
 * Weight presets for different matching strategies.
 *
 * All weights are normalized to sum to 1.0 during composition.
 * Users can select a preset or customize weights via the UI.
 */

export interface WeightPreset {
  values: number;
  causes: number;
  skills: number;
  experience: number;
  verifications: number;
  availability: number;
  location: number;
  compensation: number;
  language: number;
  [key: string]: number;
}

export const MATCH_PRESETS: Record<string, WeightPreset> = {
  'mission-first': {
    values: 0.35,
    causes: 0.25,
    skills: 0.2,
    experience: 0.1,
    verifications: 0.03,
    availability: 0.02,
    location: 0.02,
    compensation: 0.02,
    language: 0.01,
  },
  'skills-first': {
    values: 0.1,
    causes: 0.05,
    skills: 0.4,
    experience: 0.25,
    verifications: 0.08,
    availability: 0.05,
    location: 0.03,
    compensation: 0.02,
    language: 0.02,
  },
  balanced: {
    values: 0.2,
    causes: 0.15,
    skills: 0.25,
    experience: 0.15,
    verifications: 0.08,
    availability: 0.07,
    location: 0.05,
    compensation: 0.03,
    language: 0.02,
  },
};

export type PresetKey = keyof typeof MATCH_PRESETS;

export function getPreset(key: PresetKey): WeightPreset {
  return MATCH_PRESETS[key];
}

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
