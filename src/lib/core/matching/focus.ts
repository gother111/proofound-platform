import {
  isIndustryKey,
  mapIndustryListToCanonical,
  mapIndustryValueToCanonical,
  type IndustryKey,
} from '@/lib/industry/options';

const ROLE_BOOST = 0.04;
const INDUSTRY_BOOST = 0.025;
const ORG_TYPE_BOOST = 0.015;
const MAX_FOCUS_BOOST = 0.08;

export interface FocusPreferences {
  desiredRoles?: string[] | null;
  desiredIndustries?: string[] | null;
  preferredIndustryKeys?: string[] | null;
  avoidIndustryKeys?: string[] | null;
  orgTypes?: string[] | null;
}

export interface FocusAssignmentContext {
  assignmentRole?: string | null;
  orgIndustryKey?: string | null;
  orgIndustry?: string | null;
  orgType?: string | null;
}

export interface FocusBoostResult {
  boost: number;
  matched: {
    role: boolean;
    industry: boolean;
    orgType: boolean;
  };
  contributions: {
    role: number;
    industry: number;
    orgType: number;
  };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeOrgType(value: string): string {
  const normalized = normalizeText(value);
  if (normalized === 'startup') {
    return 'company';
  }
  return normalized;
}

function hasRoleMatch(desiredRoles: string[], assignmentRole?: string | null): boolean {
  if (!assignmentRole) {
    return false;
  }

  const role = normalizeText(assignmentRole);
  return desiredRoles.some((desiredRole) => {
    const normalizedDesiredRole = normalizeText(desiredRole);
    return (
      normalizedDesiredRole.length > 0 &&
      (role.includes(normalizedDesiredRole) || normalizedDesiredRole.includes(role))
    );
  });
}

function hasExactMatch(values: string[], candidate?: string | null): boolean {
  if (!candidate) {
    return false;
  }
  const normalizedCandidate = normalizeText(candidate);
  return values.some((value) => normalizeText(value) === normalizedCandidate);
}

function resolvePreferredIndustryKeys(preferences: FocusPreferences): IndustryKey[] {
  const input =
    preferences.preferredIndustryKeys && preferences.preferredIndustryKeys.length > 0
      ? preferences.preferredIndustryKeys
      : preferences.desiredIndustries || [];
  return mapIndustryListToCanonical(input).keys;
}

function resolveAvoidIndustryKeys(preferences: FocusPreferences): IndustryKey[] {
  return mapIndustryListToCanonical(preferences.avoidIndustryKeys || []).keys;
}

function resolveOrgIndustryKey(context: FocusAssignmentContext): IndustryKey | null {
  if (context.orgIndustryKey && isIndustryKey(context.orgIndustryKey)) {
    return context.orgIndustryKey;
  }

  if (typeof context.orgIndustry !== 'string' || context.orgIndustry.trim().length === 0) {
    return null;
  }

  const mapped = mapIndustryValueToCanonical(context.orgIndustry);
  return mapped.mappedFromInput ? mapped.industryKey : null;
}

export function isIndustryAvoided(
  preferences: FocusPreferences,
  context: FocusAssignmentContext
): boolean {
  const orgIndustryKey = resolveOrgIndustryKey(context);
  if (!orgIndustryKey) {
    return false;
  }

  const avoidIndustryKeys = resolveAvoidIndustryKeys(preferences);
  return avoidIndustryKeys.includes(orgIndustryKey);
}

export function calculateFocusBoost(
  preferences: FocusPreferences,
  context: FocusAssignmentContext
): FocusBoostResult {
  const desiredRoles = (preferences.desiredRoles || []).filter(Boolean);
  const preferredIndustryKeys = resolvePreferredIndustryKeys(preferences);
  const orgTypes = (preferences.orgTypes || []).filter(Boolean);
  const orgIndustryKey = resolveOrgIndustryKey(context);

  const roleMatch = hasRoleMatch(desiredRoles, context.assignmentRole);
  const industryMatch = orgIndustryKey ? preferredIndustryKeys.includes(orgIndustryKey) : false;
  const orgTypeMatch = hasExactMatch(
    orgTypes.map(normalizeOrgType),
    context.orgType ? normalizeOrgType(context.orgType) : null
  );

  const contributions = {
    role: roleMatch ? ROLE_BOOST : 0,
    industry: industryMatch ? INDUSTRY_BOOST : 0,
    orgType: orgTypeMatch ? ORG_TYPE_BOOST : 0,
  };

  return {
    boost: Math.min(
      MAX_FOCUS_BOOST,
      contributions.role + contributions.industry + contributions.orgType
    ),
    matched: {
      role: roleMatch,
      industry: industryMatch,
      orgType: orgTypeMatch,
    },
    contributions,
  };
}
