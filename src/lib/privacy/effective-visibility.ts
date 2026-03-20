import {
  mapLegacyOrganizationVisibility,
  mapLegacyProfileVisibility,
  type VisibilityLevel as CanonicalVisibilityLevel,
} from '@/lib/contracts/canonical-domain';

export const EFFECTIVE_VISIBILITY_VALUES = [
  'internal_only',
  'owner_only',
  'matched_org',
  'link_only',
  'public',
] as const;

export type EffectiveVisibility = (typeof EFFECTIVE_VISIBILITY_VALUES)[number];
export type VisibilityAudience = 'public' | 'link_holder' | 'matched_org' | 'owner' | 'trust_admin';

const VISIBILITY_RANK: Record<EffectiveVisibility, number> = {
  internal_only: 0,
  owner_only: 1,
  matched_org: 2,
  link_only: 3,
  public: 4,
};

function isCanonicalVisibility(value: string | null | undefined): value is EffectiveVisibility {
  return Boolean(value && EFFECTIVE_VISIBILITY_VALUES.includes(value as EffectiveVisibility));
}

export function normalizeEffectiveVisibility(
  value: string | null | undefined,
  source: 'profile' | 'organization' | 'proof' = 'profile'
): EffectiveVisibility {
  if (!value) {
    return 'owner_only';
  }

  if (value === 'internal_only') {
    return 'internal_only';
  }

  if (isCanonicalVisibility(value)) {
    return value;
  }

  if (source === 'organization') {
    return mapLegacyOrganizationVisibility(value).visibility as EffectiveVisibility;
  }

  return mapLegacyProfileVisibility(value).visibility as EffectiveVisibility;
}

export function computeEffectiveVisibility(input: {
  parentMaxVisibility?: string | null;
  childVisibility?: string | null;
  workflowRevealCeiling?: string | null;
  policyCeiling?: string | null;
  moderationCeiling?: string | null;
  source?: 'profile' | 'organization' | 'proof';
}): EffectiveVisibility {
  const source = input.source ?? 'profile';
  const values = [
    normalizeEffectiveVisibility(input.parentMaxVisibility ?? 'public', source),
    normalizeEffectiveVisibility(input.childVisibility ?? 'public', source),
    normalizeEffectiveVisibility(input.workflowRevealCeiling ?? 'public', source),
    normalizeEffectiveVisibility(input.policyCeiling ?? 'public', source),
    normalizeEffectiveVisibility(input.moderationCeiling ?? 'public', source),
  ];

  return values.reduce((narrowest, current) =>
    VISIBILITY_RANK[current] < VISIBILITY_RANK[narrowest] ? current : narrowest
  );
}

export function canAudienceAccessVisibility(
  visibility: EffectiveVisibility,
  audience: VisibilityAudience
): boolean {
  if (audience === 'trust_admin') {
    return false;
  }

  if (audience === 'owner') {
    return visibility !== 'internal_only';
  }

  if (visibility === 'internal_only') {
    return false;
  }

  if (visibility === 'owner_only') {
    return false;
  }

  if (visibility === 'matched_org') {
    return audience === 'matched_org';
  }

  if (visibility === 'link_only') {
    return audience === 'link_holder' || audience === 'matched_org';
  }

  return true;
}

export function isPublicSafeVisibility(visibility: EffectiveVisibility): boolean {
  return visibility === 'public';
}
