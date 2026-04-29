import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, organizationMembers, organizations } from '@/db/schema';
import { CANONICAL_ORG_ROLE_VALUES, normalizeAuthorizedOrgRole, type OrgRole } from '@/lib/authz';

export const ASSIGNMENT_MUTATION_ROLES = ['org_manager', 'org_owner'] as const;
export type AssignmentMutationRole = (typeof ASSIGNMENT_MUTATION_ROLES)[number];

type MembershipContext = {
  orgId?: string | null;
  orgSlug?: string | null;
};

type AssignmentAccessStatus =
  | 'ok'
  | 'missing_org_context'
  | 'assignment_not_found'
  | 'membership_not_found'
  | 'insufficient_role';

export type AssignmentMutationAccessResult = {
  status: AssignmentAccessStatus;
  orgId?: string;
  role?: OrgRole;
  membershipId?: string;
};

function hasRequiredRole(role: OrgRole, requiredRoles: readonly OrgRole[] | undefined) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.includes(role);
}

async function findActiveMembership(
  userId: string,
  orgId: string,
  requiredRoles?: readonly OrgRole[]
) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.state, 'active')
    ),
  });

  if (!membership) {
    return null;
  }

  const normalizedRole = normalizeAuthorizedOrgRole(membership.role);
  if (!normalizedRole || !hasRequiredRole(normalizedRole, requiredRoles)) {
    return null;
  }

  return { ...membership, role: normalizedRole };
}

/**
 * Returns true when the user belongs to the assignment's organization.
 */
export async function verifyAssignmentAccess(
  userId: string,
  assignmentId: string
): Promise<boolean> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) {
    return false;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, assignment.orgId),
      eq(organizationMembers.state, 'active')
    ),
  });

  return !!membership;
}

/**
 * Returns assignment mutation access status for owner/manager-level operations.
 */
export async function verifyAssignmentMutationAccess(
  userId: string,
  assignmentId: string,
  requiredRoles: readonly OrgRole[] = ASSIGNMENT_MUTATION_ROLES
): Promise<AssignmentMutationAccessResult> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
    columns: { id: true, orgId: true },
  });

  if (!assignment) {
    return { status: 'assignment_not_found' };
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, assignment.orgId),
      eq(organizationMembers.state, 'active')
    ),
    columns: { id: true, role: true, orgId: true },
  });

  if (!membership) {
    return { status: 'membership_not_found' };
  }

  const normalizedRole = normalizeAuthorizedOrgRole(membership.role);
  if (!normalizedRole || !hasRequiredRole(normalizedRole, requiredRoles)) {
    return {
      status: 'insufficient_role',
      orgId: membership.orgId,
      role: normalizedRole ?? undefined,
      membershipId: membership.id,
    };
  }

  return {
    status: 'ok',
    orgId: membership.orgId,
    role: normalizedRole,
    membershipId: membership.id,
  };
}

/**
 * Resolves an organization ID from explicit org context or active membership.
 * Optionally enforces role-based access.
 */
export async function resolveUserOrgContext(
  userId: string,
  context?: MembershipContext,
  requiredRoles?: readonly OrgRole[]
): Promise<string | null> {
  if (context?.orgId) {
    const membership = await findActiveMembership(userId, context.orgId, requiredRoles);
    return membership?.orgId || null;
  }

  if (context?.orgSlug) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, context.orgSlug),
      columns: { id: true },
    });

    if (!org) {
      return null;
    }

    const membership = await findActiveMembership(userId, org.id, requiredRoles);
    return membership?.orgId || null;
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.state, 'active')),
  });

  if (!membership) {
    return null;
  }

  const normalizedRole = normalizeAuthorizedOrgRole(membership.role);
  if (!normalizedRole || !hasRequiredRole(normalizedRole, requiredRoles)) {
    return null;
  }

  return membership.orgId;
}

/**
 * Resolves an organization only when the caller provides explicit org context.
 * Sensitive org reads/writes should use this instead of implicit first-membership fallback.
 */
export async function resolveExplicitUserOrgContext(
  userId: string,
  context?: MembershipContext,
  requiredRoles?: readonly OrgRole[]
): Promise<string | null> {
  if (!context?.orgId && !context?.orgSlug) {
    return null;
  }

  return resolveUserOrgContext(userId, context, requiredRoles);
}

export async function verifyExplicitAssignmentAccess(
  userId: string,
  assignmentId: string,
  context?: MembershipContext,
  requiredRoles?: readonly OrgRole[]
): Promise<AssignmentMutationAccessResult> {
  if (!context?.orgId && !context?.orgSlug) {
    return { status: 'missing_org_context' };
  }

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
    columns: { id: true, orgId: true },
  });

  if (!assignment) {
    return { status: 'assignment_not_found' };
  }

  const explicitOrgId = await resolveExplicitUserOrgContext(userId, context);
  if (!explicitOrgId || explicitOrgId !== assignment.orgId) {
    return { status: 'membership_not_found' };
  }

  const membership = await findActiveMembership(userId, assignment.orgId);
  if (!membership) {
    return { status: 'membership_not_found' };
  }

  if (!hasRequiredRole(membership.role, requiredRoles)) {
    return {
      status: 'insufficient_role',
      orgId: membership.orgId,
      role: membership.role,
      membershipId: membership.id,
    };
  }

  return {
    status: 'ok',
    orgId: membership.orgId,
    role: membership.role,
    membershipId: membership.id,
  };
}

export async function verifyExplicitAssignmentMutationAccess(
  userId: string,
  assignmentId: string,
  context?: MembershipContext,
  requiredRoles: readonly OrgRole[] = ASSIGNMENT_MUTATION_ROLES
): Promise<AssignmentMutationAccessResult> {
  return verifyExplicitAssignmentAccess(userId, assignmentId, context, requiredRoles);
}

export function isCanonicalOrgRole(value: string | null | undefined): value is OrgRole {
  return Boolean(
    value && CANONICAL_ORG_ROLE_VALUES.includes(value as (typeof CANONICAL_ORG_ROLE_VALUES)[number])
  );
}
