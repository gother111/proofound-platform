/**
 * Organization Dashboard API
 * GET /api/org/[slug]/dashboard
 *
 * Aggregates dashboard metrics for organization dashboard:
 * - Active assignments count
 * - Open shortlists (matches with interest)
 * - Pending intros (conversations started)
 * - Team member count
 * - Goals progress
 * - TTSC trend data (Time to Successful Completion)
 *
 * PRD Reference: O8 - Company Dashboard with pipeline tiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  organizations,
  organizationMembers,
  organizationGoals,
  assignments,
  matches,
  matchInterest,
  conversations,
  profiles,
} from '@/db/schema';
import { eq, and, sql, gte, desc, count } from 'drizzle-orm';

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
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify access (supports both ID and slug)
    const { org, membership } = await getOrgWithAccess(id, user.id);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all dashboard metrics concurrently (PRD Part 7)
    const [assignmentsData, teamData, goalsData, matchesData, interestData, conversationsData] =
      await Promise.all([
        // Assignments by status
        db
          .select({
            status: assignments.status,
            count: sql<number>`count(*)::int`,
          })
          .from(assignments)
          .where(eq(assignments.orgId, org.id))
          .groupBy(assignments.status),

        // Team member count by role
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

        // Goals summary
        db
          .select({
            status: organizationGoals.status,
            count: sql<number>`count(*)::int`,
          })
          .from(organizationGoals)
          .where(eq(organizationGoals.orgId, org.id))
          .groupBy(organizationGoals.status),

        // Total matches across all active assignments
        db
          .select({
            assignmentCount: sql<number>`count(distinct a.id)::int`,
            matchCount: sql<number>`count(m.id)::int`,
            avgScore: sql<number>`round(avg(m.score::numeric), 2)`,
            highQualityMatches: sql<number>`count(m.id) filter (where m.score::numeric >= 70)::int`,
          })
          .from(assignments)
          .leftJoin(matches, eq(matches.assignmentId, assignments.id))
          .where(and(eq(assignments.orgId, org.id), eq(assignments.status, 'active'))),

        // Interest/shortlist count (candidates who expressed interest)
        db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(matchInterest)
          .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
          .where(eq(assignments.orgId, org.id)),

        // Active conversations count
        db
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(conversations)
          .innerJoin(assignments, eq(conversations.assignmentId, assignments.id))
          .where(eq(assignments.orgId, org.id)),
      ]);

    // Process assignments data
    const assignmentStats = {
      total: assignmentsData.reduce((sum, a) => sum + (a.count || 0), 0),
      active: assignmentsData.find((a) => a.status === 'active')?.count || 0,
      draft: assignmentsData.find((a) => a.status === 'draft')?.count || 0,
      paused: assignmentsData.find((a) => a.status === 'paused')?.count || 0,
      closed: assignmentsData.find((a) => a.status === 'closed')?.count || 0,
    };

    // Process team data
    const teamStats = {
      total: teamData.reduce((sum, t) => sum + (t.count || 0), 0),
      owners: teamData.find((t) => t.role === 'owner')?.count || 0,
      admins: teamData.find((t) => t.role === 'admin')?.count || 0,
      members: teamData.find((t) => t.role === 'member')?.count || 0,
      viewers: teamData.find((t) => t.role === 'viewer')?.count || 0,
    };

    // Process goals data
    const goalsStats = {
      total: goalsData.reduce((sum, g) => sum + (g.count || 0), 0),
      inProgress: goalsData.find((g) => g.status === 'in_progress')?.count || 0,
      achieved: goalsData.find((g) => g.status === 'achieved')?.count || 0,
      notStarted: goalsData.find((g) => g.status === 'not_started')?.count || 0,
    };

    // Process matches data
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

    // Process interest data (shortlist)
    const shortlistCount = interestData[0]?.count || 0;

    // Process conversations data (intros)
    const activeIntros = conversationsData[0]?.count || 0;

    // Compute TTSC trend (Time to Successful Completion)
    // For now, return placeholder - would need historical data
    const ttscTrend = {
      current: null,
      previous: null,
      change: null,
      unit: 'days',
    };

    // Build dashboard response per PRD O8
    const dashboard = {
      organization: {
        id: org.id,
        name: org.displayName,
        slug: org.slug,
      },
      userRole: membership.role,
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
      // Activity summary
      activity: {
        newMatchesThisWeek: 0, // Would need date filtering
        pendingActions: shortlistCount > 0 ? 'Review shortlist candidates' : null,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Failed to fetch org dashboard:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
