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
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';
import { authorize } from '@/lib/authz/policy';
import { getCanonicalOrgTeamData } from '@/lib/organizations/team';
import { log } from '@/lib/log';

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

    const membership = await getCanonicalActiveOrgMembership(authContext.supabase, user.id, orgId);

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const decision = authorize({
      resource: 'team_invites_memberships',
      action: 'read',
      orgRole: membership.role,
    });

    if (!decision.allowed) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { members, stats } = await getCanonicalOrgTeamData(orgId);

    return NextResponse.json({
      members,
      stats,
    });
  } catch (error) {
    log.error('org.team.fetch.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Degrade gracefully to keep dashboard widget stable
    return NextResponse.json(
      {
        members: [],
        stats: {
          total: 0,
          byRole: { org_owner: 0, org_manager: 0, org_reviewer: 0 },
        },
        error: 'Failed to fetch team members',
      },
      { status: 200 }
    );
  }
}
