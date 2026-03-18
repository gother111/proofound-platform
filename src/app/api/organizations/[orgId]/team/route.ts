/**
 * Organization Team API
 * GET /api/organizations/[orgId]/team
 *
 * Fetches team members for an organization
 * Used by TeamRolesCard dashboard widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCanonicalOrgTeamData } from '@/lib/organizations/team';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { orgId } = await params;

    // Verify user is a member
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.state, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { members, stats } = await getCanonicalOrgTeamData(orgId);

    return NextResponse.json({
      members,
      stats,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    // Degrade gracefully to keep dashboard widget stable
    return NextResponse.json(
      {
        members: [],
        stats: {
          total: 0,
          byRole: { org_owner: 0, org_manager: 0, org_reviewer: 0 },
        },
        error: error instanceof Error ? error.message : 'Failed to fetch team members',
      },
      { status: 200 }
    );
  }
}
