import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, organizationMembers, organizations } from '@/db/schema';

export const ASSIGNMENT_MUTATION_ROLES = ['owner', 'admin'] as const;
export type AssignmentMutationRole = (typeof ASSIGNMENT_MUTATION_ROLES)[number];

type MembershipContext = {
  orgId?: string | null;
  orgSlug?: string | null;
};

type AssignmentAccessStatus =
  | 'ok'
  | 'assignment_not_found'
  | 'membership_not_found'
  | 'insufficient_role';

export type AssignmentMutationAccessResult = {
  status: AssignmentAccessStatus;
  orgId?: string;
  role?: string;
};

function hasRequiredRole(role: string, requiredRoles: readonly string[] | undefined) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.includes(role);
}

async function findActiveMembership(
  userId: string,
  orgId: string,
  requiredRoles?: readonly string[]
) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  if (!membership) {
    return null;
  }

  if (!hasRequiredRole(membership.role, requiredRoles)) {
    return null;
  }

  return membership;
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
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!membership;
}

/**
 * Returns assignment mutation access status for owner/admin-level operations.
 */
export async function verifyAssignmentMutationAccess(
  userId: string,
  assignmentId: string,
  requiredRoles: readonly string[] = ASSIGNMENT_MUTATION_ROLES
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
      eq(organizationMembers.status, 'active')
    ),
    columns: { role: true, orgId: true },
  });

  if (!membership) {
    return { status: 'membership_not_found' };
  }

  if (!hasRequiredRole(membership.role, requiredRoles)) {
    return {
      status: 'insufficient_role',
      orgId: membership.orgId,
      role: membership.role,
    };
  }

  return {
    status: 'ok',
    orgId: membership.orgId,
    role: membership.role,
  };
}

/**
 * Resolves an organization ID from explicit org context or active membership.
 * Optionally enforces role-based access.
 */
export async function resolveUserOrgContext(
  userId: string,
  context?: MembershipContext,
  requiredRoles?: readonly string[]
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
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')),
  });

  if (!membership) {
    return null;
  }

  if (!hasRequiredRole(membership.role, requiredRoles)) {
    return null;
  }

  return membership.orgId;
}
