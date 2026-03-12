/**
 * Organization Dashboard API
 * GET /api/org/[slug]/dashboard
 *
 * Aggregates dashboard metrics for organization dashboard:
 * - Active assignments count
 * - Open shortlists (matches in review stage)
 * - Pending intros (conversations started)
 * - Team member count
 * - Goals progress
 * - TTSC trend data (Time to Successful Completion)
 *
 * PRD Reference: O8 - Company Dashboard with pipeline tiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  organizations,
  organizationMembers,
  organizationGoals,
  assignments,
  matchReviewStates,
  matches,
  conversations,
  profiles,
} from '@/db/schema';
import { eq, and, sql, gte, desc, count } from 'drizzle-orm';
import { authorize, normalizeAuthorizedOrgRole, type OrgRole } from '@/lib/authz';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';
import { legacySurfaceJsonResponse } from '@/lib/mvp/nonLaunch';

export const dynamic = 'force-dynamic';

// Helper to get org by ID or slug and verify user access
async function getOrgWithAccess(orgIdOrSlug: string, userId: string) {
  // Try to find organization by ID first, then by slug
  const orgs = await db
    .select({
      id: organizations.id,
      displayName: organizations.displayName,
      slug: organizations.slug,
    })
    .from(organizations)
    .where(
      sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`
    )
    .limit(1);

  if (orgs.length === 0) {
    return { org: null, membership: null };
  }

  const org = orgs[0];

  // Then check user membership
  const memberships = await db
    .select({
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, 'active')
      )
    )
    .limit(1);

  return {
    org,
    membership: memberships.length > 0 ? memberships[0] : null,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!CLIENT_FF_DEFAULTS.legacyMvpSurfaces) {
    return legacySurfaceJsonResponse(
      'Organization dashboard API',
      'Organization dashboard aggregates remain isolated from the shipped MVP corridor.'
    );
  }
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id } = await params;

    // Verify access (supports both ID and slug)
    const { org, membership } = await getOrgWithAccess(id, user.id);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const orgRole = (normalizeAuthorizedOrgRole(membership?.role) as OrgRole | null) ?? null;
    if (
      !authorize({
        resource: 'assignments',
        action: 'read',
        orgRole,
      }).allowed
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Defaults ensure we still respond 200 on partial failures
    let assignmentsData: { status: string | null; count: number | null }[] = [];
    let teamData: { role: string | null; count: number | null }[] = [];
    let goalsData: { status: string | null; count: number | null }[] = [];
    let matchesData: {
      assignmentCount: number | null;
      matchCount: number | null;
      avgScore: number | null;
      highQualityMatches: number | null;
    }[] = [];
    let shortlistData: { count: number | null }[] = [];
    let conversationsData: { count: number | null }[] = [];

    try {
      // Fetch all dashboard metrics concurrently (PRD Part 7)
      [assignmentsData, teamData, goalsData, matchesData, shortlistData, conversationsData] =
        await Promise.all([
          db
            .select({
              status: assignments.status,
              count: sql<number>`count(*)::int`,
            })
            .from(assignments)
            .where(eq(assignments.orgId, org.id))
            .groupBy(assignments.status),

          db
            .select({
              role: organizationMembers.role,
              count: sql<number>`count(*)::int`,
            })
            .from(organizationMembers)
            .where(
              and(eq(organizationMembers.orgId, org.id), eq(organizationMembers.status, 'active'))
            )
            .groupBy(organizationMembers.role),

          db
            .select({
              status: organizationGoals.status,
              count: sql<number>`count(*)::int`,
            })
            .from(organizationGoals)
            .where(eq(organizationGoals.orgId, org.id))
            .groupBy(organizationGoals.status),

          db
            .select({
              assignmentCount: sql<number>`count(distinct ${assignments.id})::int`,
              matchCount: sql<number>`count(${matches.id})::int`,
              avgScore: sql<number>`round(avg(${matches.score}::numeric), 2)`,
              highQualityMatches: sql<number>`count(${matches.id}) filter (where ${matches.score}::numeric >= 70)::int`,
            })
            .from(assignments)
            .leftJoin(matches, eq(matches.assignmentId, assignments.id))
            .where(and(eq(assignments.orgId, org.id), eq(assignments.status, 'active'))),

          db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(matchReviewStates)
            .where(
              and(
                eq(matchReviewStates.orgId, org.id),
                eq(matchReviewStates.reviewStage, 'shortlisted')
              )
            ),

          db
            .select({
              count: sql<number>`count(*)::int`,
            })
            .from(conversations)
            .innerJoin(assignments, eq(conversations.assignmentId, assignments.id))
            .where(eq(assignments.orgId, org.id)),
        ]);
    } catch (err) {
      console.error('dashboard.metrics.fetch_failed', err);
      // Keep defaults to avoid 500
    }

    const assignmentStats = {
      total: assignmentsData.reduce((sum, a) => sum + (a.count || 0), 0),
      active: assignmentsData.find((a) => a.status === 'active')?.count || 0,
      draft: assignmentsData.find((a) => a.status === 'draft')?.count || 0,
      hold: assignmentsData.find((a) => a.status === 'hold')?.count || 0,
      closed: assignmentsData.find((a) => a.status === 'closed')?.count || 0,
    };

    const teamStats = {
      total: teamData.reduce((sum, t) => sum + (t.count || 0), 0),
      owners: teamData.find((t) => t.role === 'owner')?.count || 0,
      admins: teamData.find((t) => t.role === 'admin')?.count || 0,
      members: teamData.find((t) => t.role === 'member')?.count || 0,
      viewers: teamData.find((t) => t.role === 'viewer')?.count || 0,
    };

    const goalsStats = {
      total: goalsData.reduce((sum, g) => sum + (g.count || 0), 0),
      inProgress: goalsData.find((g) => g.status === 'in_progress')?.count || 0,
      achieved: goalsData.find((g) => g.status === 'achieved')?.count || 0,
      notStarted: goalsData.find((g) => g.status === 'not_started')?.count || 0,
    };

    const matchData = matchesData[0] || {
      assignmentCount: 0,
      matchCount: 0,
      avgScore: 0,
      highQualityMatches: 0,
    };
    const matchStats = {
      totalMatches: matchData.matchCount || 0,
      averageScore: matchData.avgScore || 0,
      highQuality: matchData.highQualityMatches || 0,
      assignmentsWithMatches: matchData.assignmentCount || 0,
    };

    const shortlistCount = shortlistData[0]?.count || 0;
    const activeIntros = conversationsData[0]?.count || 0;

    const ttscTrend = {
      current: null,
      previous: null,
      change: null,
      unit: 'days',
    };

    const dashboard = {
      organization: {
        id: org.id,
        name: org.displayName,
        slug: org.slug,
      },
      userRole: orgRole,
      pipeline: {
        openAssignments: assignmentStats.active,
        totalAssignments: assignmentStats.total,
        shortlists: shortlistCount,
        intros: activeIntros,
        matches: matchStats,
      },
      assignments: assignmentStats,
      team: teamStats,
      goals: goalsStats,
      ttsc: ttscTrend,
      activity: {
        newMatchesThisWeek: 0,
        pendingActions: shortlistCount > 0 ? 'Review shortlist candidates' : null,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Failed to fetch org dashboard:', error);
    // Gracefully degrade instead of 500 to keep UI stable
    return NextResponse.json({
      organization: null,
      userRole: null,
      pipeline: {
        openAssignments: 0,
        totalAssignments: 0,
        shortlists: 0,
        intros: 0,
        matches: {
          totalMatches: 0,
          averageScore: 0,
          highQuality: 0,
          assignmentsWithMatches: 0,
        },
      },
      assignments: { total: 0, active: 0, draft: 0, hold: 0, closed: 0 },
      team: { total: 0, owners: 0, admins: 0, members: 0, viewers: 0 },
      goals: { total: 0, inProgress: 0, achieved: 0, notStarted: 0 },
      ttsc: { current: null, previous: null, change: null, unit: 'days' },
      activity: { newMatchesThisWeek: 0, pendingActions: null },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
