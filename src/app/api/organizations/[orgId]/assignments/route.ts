import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';
import { db } from '@/db';
import { assignmentInvitations, organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    ({ orgId } = await params);

    if (authError || !user) {
      log.warn('org.assignments.list.unauthorized', {
        orgId,
        hasAuthError: !!authError,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = user.id;

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.state, 'active')
      ),
      columns: { role: true },
    });

    const orgRole = normalizeAuthorizedOrgRole(membership?.role);
    if (!membership || !orgRole || !['org_owner', 'org_manager'].includes(orgRole)) {
      log.warn('org.assignments.list.forbidden', {
        orgId,
        userId: user.id,
        role: orgRole ?? membership?.role ?? null,
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
