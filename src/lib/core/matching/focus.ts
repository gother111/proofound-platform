const ROLE_BOOST = 0.04;
const INDUSTRY_BOOST = 0.025;
const ORG_TYPE_BOOST = 0.015;
const MAX_FOCUS_BOOST = 0.08;

export interface FocusPreferences {
  desiredRoles?: string[] | null;
  desiredIndustries?: string[] | null;
  orgTypes?: string[] | null;
}

export interface FocusAssignmentContext {
  assignmentRole?: string | null;
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

export function calculateFocusBoost(
  preferences: FocusPreferences,
  context: FocusAssignmentContext
): FocusBoostResult {
  const desiredRoles = (preferences.desiredRoles || []).filter(Boolean);
  const desiredIndustries = (preferences.desiredIndustries || []).filter(Boolean);
  const orgTypes = (preferences.orgTypes || []).filter(Boolean);

  const roleMatch = hasRoleMatch(desiredRoles, context.assignmentRole);
  const industryMatch = hasExactMatch(desiredIndustries, context.orgIndustry);
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
