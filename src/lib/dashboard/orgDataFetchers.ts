import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import {
  organizationMembers,
  profiles,
  assignments,
  matches,
  matchInterest,
  conversations,
} from '@/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { getOrganizationReadinessCached } from '@/lib/readiness/organization';
import {
  getMomentumSummaryCached,
  getMomentumUpdatesForPersonaCached,
} from '@/lib/momentum/summary';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';

export async function getOrgGoalsData(orgId: string) {
  try {
    const supabase = await createClient();
    const { data: goals, error } = await supabase
      .from('organization_goals')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org goals:', error);
      return [];
    }
    return goals || [];
  } catch (error) {
    console.error('Error in getOrgGoalsData:', error);
    return [];
  }
}

export async function getOrgProjectsData(orgId: string) {
  try {
    const supabase = await createClient();
    const { data: projects, error } = await supabase
      .from('organization_projects')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching org projects:', error);
      return [];
    }
    return projects || [];
  } catch (error) {
    console.error('Error in getOrgProjectsData:', error);
    return [];
  }
}

export async function getOrgTeamData(orgId: string) {
  try {
    const members = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        status: organizationMembers.status,
        displayName: profiles.displayName,
        handle: profiles.handle,
        avatarUrl: profiles.avatarUrl,
        createdAt: organizationMembers.joinedAt,
      })
      .from(organizationMembers)
      .innerJoin(profiles, eq(profiles.id, organizationMembers.userId))
      .where(eq(organizationMembers.orgId, orgId))
      .orderBy(
        sql`case 
          when ${organizationMembers.role} = 'owner' then 1 
          when ${organizationMembers.role} = 'admin' then 2 
          when ${organizationMembers.role} = 'member' then 3 
          else 4 
        end`
      );

    const roleStats = await db
      .select({
        role: organizationMembers.role,
        count: sql<number>`count(*)::int`,
      })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.status, 'active')))
      .groupBy(organizationMembers.role);

    const stats = {
      total: roleStats.reduce((sum, r) => sum + (r.count || 0), 0),
      owners: roleStats.find((r) => r.role === 'owner')?.count || 0,
      admins: roleStats.find((r) => r.role === 'admin')?.count || 0,
      members: roleStats.find((r) => r.role === 'member')?.count || 0,
      viewers: roleStats.find((r) => r.role === 'viewer')?.count || 0,
    };

    return { members, stats };
  } catch (error) {
    console.error('Error fetching org team data:', error);
    return { members: [], stats: { total: 0, owners: 0, admins: 0, members: 0, viewers: 0 } };
  }
}

export async function getOrgReadinessData(orgId: string, userId: string) {
  try {
    const usePerfCache = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE,
      { userId, orgId },
      true
    );
    // always use cached version for speed, fallbacks handle misses
    return await getOrganizationReadinessCached(orgId);
  } catch (error) {
    console.error('Error fetching org readiness:', error);
    return null;
  }
}

export async function getOrgMomentumData(userId: string, orgRef: string | undefined) {
  try {
    return await getMomentumSummaryCached(userId, 'organization', orgRef);
  } catch (error) {
    console.error('Error fetching org momentum summary:', error);
    return null;
  }
}

export async function getOrgUpdatesData(userId: string, orgRef: string | undefined) {
  try {
    const updatesPayload = await getMomentumUpdatesForPersonaCached(
      userId,
      'organization',
      8,
      orgRef
    );
    return updatesPayload.updates;
  } catch (error) {
    console.error('Error fetching org updates:', error);
    return [];
  }
}

export async function getOrgDashboardMetrics(orgId: string, userId: string) {
  try {
    // defaults
    let assignmentsData: { status: string | null; count: number | null }[] = [];
    let matchesData: {
      assignmentCount: number | null;
      matchCount: number | null;
      avgScore: number | null;
      highQualityMatches: number | null;
    }[] = [];
    let interestData: { count: number | null }[] = [];
    let conversationsData: { count: number | null }[] = [];

    [assignmentsData, matchesData, interestData, conversationsData] = await Promise.all([
      db
        .select({
          status: assignments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(assignments)
        .where(eq(assignments.orgId, orgId))
        .groupBy(assignments.status),

      db
        .select({
          assignmentCount: sql<number>`count(distinct ${assignments.id})::int`,
          matchCount: sql<number>`count(${matches.id})::int`,
          avgScore: sql<number>`round(avg(${matches.score}::numeric), 2)`,
          highQualityMatches: sql<number>`count(${matches.id}) filter (where ${matches.score}::numeric >= 70)::int`,
        })
        .from(assignments)
        .leftJoin(matches, eq(matches.assignmentId, assignments.id))
        .where(and(eq(assignments.orgId, orgId), eq(assignments.status, 'active'))),

      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(matchInterest)
        .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
        .where(and(eq(assignments.orgId, orgId), isNull(matchInterest.targetProfileId))),

      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(conversations)
        .innerJoin(assignments, eq(conversations.assignmentId, assignments.id))
        .where(eq(assignments.orgId, orgId)),
    ]);

    const assignmentStats = {
      total: assignmentsData.reduce((sum, a) => sum + (a.count || 0), 0),
      active: assignmentsData.find((a) => a.status === 'active')?.count || 0,
    };

    const matchData = matchesData[0] || {
      assignmentCount: 0,
      matchCount: 0,
      avgScore: 0,
      highQualityMatches: 0,
    };

    const shortlistCount = interestData[0]?.count || 0;
    const activeIntros = conversationsData[0]?.count || 0;

    return {
      pipeline: {
        openAssignments: assignmentStats.active,
        totalAssignments: assignmentStats.total,
        shortlists: shortlistCount,
        intros: activeIntros,
        matches: {
          totalMatches: matchData.matchCount || 0,
          averageScore: matchData.avgScore || 0,
          highQuality: matchData.highQualityMatches || 0,
          assignmentsWithMatches: matchData.assignmentCount || 0,
        },
      },
      assignments: {
        total: assignmentStats.total,
        active: assignmentStats.active,
        draft: assignmentsData.find((a) => a.status === 'draft')?.count || 0,
        hold: assignmentsData.find((a) => a.status === 'hold')?.count || 0,
        closed: assignmentsData.find((a) => a.status === 'closed')?.count || 0,
      },
      activity: {
        newMatchesThisWeek: 0,
        pendingActions: null,
      },
    };
  } catch (error) {
    console.error('Failed to fetch org dashboard metrics:', error);
    return null;
  }
}
