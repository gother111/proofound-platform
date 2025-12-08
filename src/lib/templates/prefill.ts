// Vitest/SSR safety: provide a hoisted no-op __vite_ssr_exportName__ for transformed exports
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function __vite_ssr_exportName__(name: string, value: any) {
  return value;
}

export const DEFAULT_TEMPLATE_STEPS = [
  'business_value',
  'outcomes',
  'weights',
  'practicals',
  'expertise',
];

export type TemplateWeights = {
  mission: number;
  expertise: number;
  workMode: number;
};

export type TemplateSkill = {
  id: string;
  label?: string;
  level?: number;
  linkedToBV?: boolean;
  linkedToTO?: boolean;
};

export type AssignmentTemplatePayload = {
  role?: string;
  businessValue?: string;
  expectedImpact?: string;
  stakeholders?: string[];
  outcomes?: Array<{ metric: string; target: string; timeframe: string }>;
  weights?: TemplateWeights;
  workModeRequirement?: 'hard' | 'soft';
  workModePreference?: 'onsite' | 'hybrid' | 'remote';
  locationMode?: 'onsite' | 'hybrid' | 'remote';
  city?: string;
  country?: string;
  compMin?: number;
  compMax?: number;
  currency?: string;
  hoursMin?: number;
  hoursMax?: number;
  startEarliest?: string;
  startLatest?: string;
  duration?: string;
  verificationGates?: string[];
  mustHaveSkills?: TemplateSkill[];
  niceToHaveSkills?: TemplateSkill[];
  educationRequired?: boolean;
  educationJustification?: string;
};

const DEFAULT_WEIGHTS: TemplateWeights = {
  mission: 33,
  expertise: 34,
  workMode: 33,
};

function normalizeWeights(weights?: TemplateWeights): TemplateWeights {
  const fallback = { ...DEFAULT_WEIGHTS };
  if (!weights) return fallback;

  const total = (weights.mission || 0) + (weights.expertise || 0) + (weights.workMode || 0);
  if (total === 100) return weights;
  if (total === 0) return fallback;

  const ratio = 100 / total;
  return {
    mission: Math.round((weights.mission || 0) * ratio),
    expertise: Math.round((weights.expertise || 0) * ratio),
    workMode: Math.max(0, 100 - Math.round((weights.mission || 0) * ratio) - Math.round((weights.expertise || 0) * ratio)),
  };
}

export function mapTemplateToAssignmentForm(payload?: AssignmentTemplatePayload) {
  const safe = payload || {};
  const weights = normalizeWeights(safe.weights);

  const mustHaveSkills =
    safe.mustHaveSkills?.map((skill) => ({
      id: skill.id,
      label: skill.label || skill.id,
      level: skill.level ?? 3,
      linkedToBV: !!skill.linkedToBV,
      linkedToTO: !!skill.linkedToTO,
    })) || [];

  const niceToHaveSkills =
    safe.niceToHaveSkills?.map((skill) => ({
      id: skill.id,
      label: skill.label || skill.id,
      level: skill.level ?? 2,
    })) || [];

  return {
    role: safe.role || '',
    businessValue: safe.businessValue || '',
    expectedImpact: safe.expectedImpact || '',
    stakeholders: safe.stakeholders || [],
    outcomes: safe.outcomes || [],
    weights,
    missionWeight: weights.mission,
    expertiseWeight: weights.expertise,
    workModeRequirement: safe.workModeRequirement || 'soft',
    workModePreference: safe.workModePreference || 'hybrid',
    locationMode: safe.locationMode || safe.workModePreference || 'hybrid',
    compMin: safe.compMin ?? 0,
    compMax: safe.compMax ?? 0,
    currency: safe.currency || 'USD',
    hoursMin: safe.hoursMin ?? 10,
    hoursMax: safe.hoursMax ?? 40,
    city: safe.city || '',
    country: safe.country || '',
    startEarliest: safe.startEarliest || '',
    startLatest: safe.startLatest || '',
    duration: safe.duration || '12mo',
    verificationGates: safe.verificationGates || [],
    mustHaveSkills,
    niceToHaveSkills,
    educationRequired: !!safe.educationRequired,
    educationJustification: safe.educationJustification || '',
  };
}

