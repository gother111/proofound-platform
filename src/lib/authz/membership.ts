import { canonicalOrgMembershipStates, canonicalOrgRoleValues } from '@/db/schema';
import {
  CANONICAL_ORG_ROLE_VALUES,
  ORG_ACTIVE_MEMBERSHIP_STATES,
  type OrgRole,
} from '@/lib/authz/policy';

export type CanonicalOrgMembershipState = (typeof canonicalOrgMembershipStates)[number];
export type CanonicalOrgRole = (typeof canonicalOrgRoleValues)[number];
export type CompatibilityPrincipalRole = 'individual' | 'trust_admin';
export type NormalizedOrgRole = CanonicalOrgRole | CompatibilityPrincipalRole;
type LegacyOrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type CanonicalOrgRoleStats = {
  total: number;
  byRole: Record<OrgRole, number>;
};

const LEGACY_ROLE_MAP = {
  owner: 'org_owner',
  admin: 'org_manager',
  member: 'org_reviewer',
  viewer: 'org_reviewer',
} as const satisfies Record<LegacyOrgRole, OrgRole>;

const LEGACY_MEMBERSHIP_STATE_MAP = {
  invited: 'invited_pending',
  pending: 'invited_pending',
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
  removed: 'removed',
  declined: 'declined',
  expired: 'expired',
  revoked: 'revoked',
} as const satisfies Record<string, CanonicalOrgMembershipState>;

const TEAM_ROLE_PRIORITY = {
  org_owner: 0,
  org_manager: 1,
  org_reviewer: 2,
} as const satisfies Record<OrgRole, number>;

function buildEmptyCanonicalOrgRoleStats(): CanonicalOrgRoleStats {
  return {
    total: 0,
    byRole: {
      org_owner: 0,
      org_manager: 0,
      org_reviewer: 0,
    },
  };
}

export function normalizeOrgRole(value: string | null | undefined): NormalizedOrgRole | null {
  if (!value) {
    return null;
  }

  const legacyMapped = LEGACY_ROLE_MAP[value as keyof typeof LEGACY_ROLE_MAP];
  if (legacyMapped) {
    return legacyMapped;
  }

  if (
    CANONICAL_ORG_ROLE_VALUES.includes(value as (typeof CANONICAL_ORG_ROLE_VALUES)[number]) ||
    value === 'individual' ||
    value === 'trust_admin'
  ) {
    return value as CanonicalOrgRole;
  }

  if (canonicalOrgRoleValues.includes(value as CanonicalOrgRole)) {
    return value as CanonicalOrgRole;
  }

  return null;
}

export function normalizeAuthorizedOrgRole(value: string | null | undefined): OrgRole | null {
  const normalized = normalizeOrgRole(value);
  if (!normalized) {
    return null;
  }

  return CANONICAL_ORG_ROLE_VALUES.includes(
    normalized as (typeof CANONICAL_ORG_ROLE_VALUES)[number]
  )
    ? (normalized as OrgRole)
    : null;
}

export function normalizeMembershipState(
  value: string | null | undefined
): CanonicalOrgMembershipState {
  if (!value) {
    return 'active';
  }

  if (canonicalOrgMembershipStates.includes(value as CanonicalOrgMembershipState)) {
    return value as CanonicalOrgMembershipState;
  }

  return LEGACY_MEMBERSHIP_STATE_MAP[value as keyof typeof LEGACY_MEMBERSHIP_STATE_MAP] ?? 'active';
}

export function isActiveMembershipState(value: string | null | undefined): boolean {
  const normalized = normalizeMembershipState(value);
  return ORG_ACTIVE_MEMBERSHIP_STATES[0] === normalized;
}

export function membershipGrantsOrgAccess(value: string | null | undefined): boolean {
  return isActiveMembershipState(value);
}

export function getCanonicalOrgRolePriority(value: string | null | undefined): number {
  const normalized = normalizeAuthorizedOrgRole(value);
  return normalized ? TEAM_ROLE_PRIORITY[normalized] : Number.MAX_SAFE_INTEGER;
}

export function buildCanonicalOrgRoleStats(
  members: Array<{ role: string | null | undefined; status?: string | null; state?: string | null }>
): CanonicalOrgRoleStats {
  const stats = buildEmptyCanonicalOrgRoleStats();

  for (const member of members) {
    const normalizedRole = normalizeAuthorizedOrgRole(member.role);
    const membershipState = member.state ?? member.status ?? null;

    if (!normalizedRole || !isActiveMembershipState(membershipState)) {
      continue;
    }

    stats.total += 1;
    stats.byRole[normalizedRole] += 1;
  }

  return stats;
}
