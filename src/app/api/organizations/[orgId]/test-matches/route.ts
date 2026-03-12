import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, conversations, matches, organizationMembers, profiles } from '@/db/schema';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getMembership(orgId: string, userId: string) {
  const [membership] = await db
    .select({
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return membership ?? null;
}

async function isBetaTestingUser(userId: string) {
  const [profile] = await db
    .select({
      isBetaTesting: profiles.isBetaTesting,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.isBetaTesting ?? false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await params;
    const membership = await getMembership(orgId, user.id);
    const membershipRole = normalizeAuthorizedOrgRole(membership?.role);

    if (!membershipRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const assignmentId = request.nextUrl.searchParams.get('assignmentId');

    if (assignmentId) {
      const [assignment] = await db
        .select({ id: assignments.id })
        .from(assignments)
        .where(and(eq(assignments.id, assignmentId), eq(assignments.orgId, orgId)))
        .limit(1);

      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found for this organization.' },
          { status: 404 }
        );
      }
    }

    const whereConditions = [eq(assignments.orgId, orgId), eq(matches.isTestMatch, true)];
    if (assignmentId) {
      whereConditions.push(eq(matches.assignmentId, assignmentId));
    }

    const rows = await db
      .select({
        matchId: matches.id,
        assignmentId: matches.assignmentId,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        candidateProfileId: profiles.id,
        candidateDisplayName: profiles.displayName,
        candidateHandle: profiles.handle,
        candidateAvatarUrl: profiles.avatarUrl,
        conversationId: conversations.id,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .leftJoin(profiles, eq(profiles.id, matches.profileId))
      .leftJoin(conversations, eq(conversations.matchId, matches.id))
      .where(and(...whereConditions))
      .orderBy(desc(matches.createdAt));

    const isBetaTesting = await isBetaTestingUser(user.id);

    return NextResponse.json({
      items: rows,
      permissions: {
        canManage: ['org_owner', 'org_manager'].includes(membershipRole),
        canInitiateTest: isBetaTesting && ['org_owner', 'org_manager'].includes(membershipRole),
      },
    });
  } catch (error) {
    console.error('Failed to load organization test matches:', error);
    return NextResponse.json({ error: 'Failed to load test matches' }, { status: 500 });
  }
}
