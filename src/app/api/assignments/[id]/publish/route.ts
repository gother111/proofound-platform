import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, organizationMembers, organizations } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const user = await requireAuth();
    const { id } = await params;
    assignmentId = id;

    const orgSlug = request.nextUrl.searchParams.get('orgSlug');

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (orgSlug) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.slug, orgSlug),
      });

      if (!org || org.id !== assignment.orgId) {
        return NextResponse.json({ error: 'Organization context mismatch' }, { status: 403 });
      }
    }

    const [publishedAssignment] = await db
      .update(assignments)
      .set({
        status: 'active',
        creationStatus: 'published',
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    await checkAndEmitAssignmentActivation({
      assignmentId: publishedAssignment.id,
      orgId: publishedAssignment.orgId,
      createdAt: publishedAssignment.createdAt,
      userId: user.id,
    });

    return NextResponse.json({ assignment: publishedAssignment });
  } catch (error) {
    log.error('assignment.publish.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to publish assignment' }, { status: 500 });
  }
}
