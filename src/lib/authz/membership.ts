import { canonicalOrgMembershipStates, canonicalOrgRoleValues } from '@/db/schema';
import {
  CANONICAL_ORG_ROLE_VALUES,
  ORG_ACTIVE_MEMBERSHIP_STATES,
  type OrgRole,
} from '@/lib/authz/policy';

export type CanonicalOrgMembershipState = (typeof canonicalOrgMembershipStates)[number];
export type CanonicalOrgRole = (typeof canonicalOrgRoleValues)[number];

const LEGACY_ROLE_MAP = {
  owner: 'org_owner',
  admin: 'org_manager',
  member: 'org_reviewer',
  viewer: 'org_reviewer',
} as const satisfies Record<string, OrgRole>;

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

export function normalizeOrgRole(value: string | null | undefined): CanonicalOrgRole | null {
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
