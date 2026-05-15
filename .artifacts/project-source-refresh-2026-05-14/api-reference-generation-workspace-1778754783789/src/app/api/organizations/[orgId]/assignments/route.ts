import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalActiveOrgMembership, requireApiAuth } from '@/lib/api/auth';
import { db } from '@/db';
import { assignmentInvitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/assignments
 * List all assignment invitations for an organization
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  let userId: string | undefined;
  let orgId: string | undefined;

  try {
    const auth = await requireApiAuth();

    ({ orgId } = await params);

    if (auth instanceof NextResponse) {
      log.warn('org.assignments.list.unauthorized', {
        orgId,
        hasAuthError: true,
      });
      return auth;
    }
    const { user, supabase } = auth;
    userId = user.id;

    const membership = await getCanonicalActiveOrgMembership(supabase, user.id, orgId);
    if (!membership || !['org_owner', 'org_manager'].includes(membership.role)) {
      log.warn('org.assignments.list.forbidden', {
        orgId,
        userId: user.id,
        role: membership?.role ?? null,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignments = await db.query.assignmentInvitations.findMany({
      where: eq(assignmentInvitations.orgId, orgId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    log.info('org.assignments.list.success', {
      orgId,
      userId: user.id,
      count: assignments.length,
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    log.error('org.assignments.list.failed', {
      orgId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
