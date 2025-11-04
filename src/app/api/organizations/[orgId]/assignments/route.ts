import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignmentInvitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/assignments
 * List all assignment invitations for an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    await requireAuth();
    const { orgId } = await params;

    const assignments = await db
      .select()
      .from(assignmentInvitations)
      .where(eq(assignmentInvitations.orgId, orgId))
      .orderBy(assignmentInvitations.createdAt);

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
