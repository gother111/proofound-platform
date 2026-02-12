import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';

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
