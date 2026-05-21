import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  assignmentExpertiseMatrix,
  assignments,
  matches,
  matchInterest,
  organizations,
} from '@/db/schema';
import { calculateNextActions } from '@/lib/analytics/next-actions';
import { getOrSetTtlCache, PLATFORM_PERF_CACHE_TTL_MS } from '@/lib/performance/ttl-cache';
import type {
  OrganizationReadiness,
  ReadinessAction,
  ReadinessScoreBreakdown,
} from '@/lib/momentum/types';

const ORGANIZATION_READINESS_CACHE_PREFIX = 'readiness:organization';

function classifyAvailability(count: number): 'scarce' | 'emerging' | 'available' {
  if (count <= 2) return 'scarce';
  if (count <= 10) return 'emerging';
  return 'available';
}

export async function resolveOrganizationId(orgRef: string): Promise<string | null> {
  const org = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(sql`${organizations.id}::text = ${orgRef} OR ${organizations.slug} = ${orgRef}`)
    .limit(1);

  return org[0]?.id ?? null;
}

export async function getOrganizationReadiness(orgId: string): Promise<OrganizationReadiness> {
  const [organizationRow, assignmentRows, matchStatsRow, shortlistStatsRow, matrixRows] =
    await Promise.all([
      db
        .select({ slug: organizations.slug })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1),

      db
        .select({
          id: assignments.id,
          role: assignments.role,
          description: assignments.description,
          businessValue: assignments.businessValue,
          expectedImpact: assignments.expectedImpact,
          verificationGates: assignments.verificationGates,
          status: assignments.status,
        })
        .from(assignments)
        .where(eq(assignments.orgId, orgId)),

      db
        .select({
          totalMatches: sql<number>`count(${matches.id})::int`,
        })
        .from(matches)
        .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
        .where(eq(assignments.orgId, orgId)),

      db
        .select({
          totalShortlists: sql<number>`count(${matchInterest.id})::int`,
        })
        .from(matchInterest)
        .innerJoin(assignments, eq(matchInterest.assignmentId, assignments.id))
        .where(eq(assignments.orgId, orgId)),

      db
        .select({
          assignmentId: assignmentExpertiseMatrix.assignmentId,
          skillCode: assignmentExpertiseMatrix.skillCode,
        })
        .from(assignmentExpertiseMatrix)
        .innerJoin(assignments, eq(assignmentExpertiseMatrix.assignmentId, assignments.id))
        .where(and(eq(assignments.orgId, orgId), eq(assignments.status, 'active'))),
    ]);
  const organizationSlug = organizationRow[0]?.slug ?? null;

  const activeAssignments = assignmentRows.filter((row) => row.status === 'active');
  const totalActiveAssignments = activeAssignments.length;

  const matrixByAssignment = new Map<string, number>();
  for (const row of matrixRows) {
    matrixByAssignment.set(row.assignmentId, (matrixByAssignment.get(row.assignmentId) ?? 0) + 1);
  }

  const assignmentWithRequirements = activeAssignments.filter(
    (row) => (matrixByAssignment.get(row.id) ?? 0) > 0
  ).length;

  const assignmentWithVerificationGates = activeAssignments.filter(
    (row) => (row.verificationGates?.length ?? 0) > 0
  ).length;

  const assignmentWithClearScope = activeAssignments.filter((row) => {
    const descriptionLength = row.description?.trim().length ?? 0;
    const hasBusinessValue = Boolean(row.businessValue?.trim());
    const hasExpectedImpact = Boolean(row.expectedImpact?.trim());
    return descriptionLength >= 80 || (hasBusinessValue && hasExpectedImpact);
  }).length;

  const readinessChecks: Array<{ key: string; label: string; pass: boolean; notes: string }> = [
    {
      key: 'active_assignments',
      label: 'Active assignments available',
      pass: totalActiveAssignments > 0,
      notes: 'At least one active assignment is needed for the proof-review flow.',
    },
    {
      key: 'requirements_coverage',
      label: 'Requirements matrix complete',
      pass:
        totalActiveAssignments === 0
          ? false
          : assignmentWithRequirements === totalActiveAssignments,
      notes: 'Each active assignment should define required skills.',
    },
    {
      key: 'verification_gates',
      label: 'Verification gates configured',
      pass:
        totalActiveAssignments === 0
          ? false
          : assignmentWithVerificationGates / totalActiveAssignments >= 0.5,
      notes: 'Verification gates reduce unanchored proof-review flow.',
    },
    {
      key: 'scope_quality',
      label: 'Scope clarity',
      pass:
        totalActiveAssignments === 0
          ? false
          : assignmentWithClearScope / totalActiveAssignments >= 0.5,
      notes: 'Clear scope improves matching precision and response rates.',
    },
  ];

  const scoreBreakdown: ReadinessScoreBreakdown[] = readinessChecks.map((check) => ({
    key: check.key,
    label: check.label,
    score: check.pass ? 25 : 8,
    maxScore: 25,
    notes: check.notes,
  }));

  const readinessScore = scoreBreakdown.reduce((sum, item) => sum + item.score, 0);

  const requiredSkillCodes = Array.from(new Set(matrixRows.map((row) => row.skillCode)));
  let talentAvailabilityInsights: OrganizationReadiness['talentAvailabilityInsights'] = [];

  if (requiredSkillCodes.length > 0) {
    const demandRows = await db.execute(sql`
      SELECT
        aem.skill_code,
        COUNT(*)::int AS required_by_assignments,
        COUNT(DISTINCT s.profile_id)::int AS available_profiles
      FROM assignment_expertise_matrix aem
      JOIN assignments a ON a.id = aem.assignment_id
      LEFT JOIN skills s
        ON s.skill_code = aem.skill_code
       AND s.level >= aem.required_level
      WHERE a.org_id = ${orgId}
        AND a.status = 'active'
      GROUP BY aem.skill_code
      ORDER BY required_by_assignments DESC, available_profiles ASC
      LIMIT 8
    `);

    const taxonomyRows = await db.execute(sql`
      SELECT code, COALESCE(name_i18n ->> 'en', code) AS skill_name
      FROM skills_taxonomy
      WHERE code = ANY(${requiredSkillCodes})
    `);

    const demand = (demandRows as { rows?: Array<any> }).rows ?? [];
    const taxonomy = (taxonomyRows as { rows?: Array<any> }).rows ?? [];
    const taxonomyMap = new Map<string, string>();

    for (const row of taxonomy) {
      taxonomyMap.set(String(row.code), String(row.skill_name));
    }

    talentAvailabilityInsights = demand.map((row) => {
      const availableProfiles = Number(row.available_profiles) || 0;
      const requiredByAssignments = Number(row.required_by_assignments) || 0;
      const skillCode = String(row.skill_code);
      return {
        skillCode,
        skillName: taxonomyMap.get(skillCode) || skillCode,
        requiredByAssignments,
        availableProfiles,
        signal: classifyAvailability(availableProfiles),
      };
    });
  }

  const topActions: ReadinessAction[] = [];

  if (totalActiveAssignments === 0) {
    topActions.push({
      id: 'create-first-assignment',
      title: 'Create your first active assignment',
      description: 'Publish one assignment to start receiving real proof submissions.',
      priority: 'high',
      category: 'assignment',
      actionUrl: '/app/o',
    });
  }

  if (assignmentWithRequirements < totalActiveAssignments) {
    topActions.push({
      id: 'complete-requirements-matrix',
      title: 'Complete required skills for active assignments',
      description: 'Assignments without required skills make proof review less precise.',
      priority: 'high',
      category: 'assignment',
      actionUrl: '/app/o',
    });
  }

  if (assignmentWithVerificationGates < totalActiveAssignments) {
    topActions.push({
      id: 'add-verification-gates',
      title: 'Add verification gates',
      description:
        'Use work email, identity, or proof gates to make assignment review more specific.',
      priority: 'medium',
      category: 'process',
      actionUrl: '/app/o',
    });
  }

  if (talentAvailabilityInsights.some((item) => item.signal === 'scarce')) {
    topActions.push({
      id: 'relax-hard-constraints',
      title: 'Relax scarce-skill constraints',
      description: 'Broaden location or level requirements for scarce skills.',
      priority: 'medium',
      category: 'matching',
      actionUrl: '/app/o',
    });
  }

  const analyticsActions = await calculateNextActions(orgId, organizationSlug);
  const mappedAnalyticsActions: ReadinessAction[] = analyticsActions.slice(0, 2).map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    priority: action.priority === 'critical' || action.priority === 'high' ? 'high' : 'medium',
    category:
      action.category === 'matching'
        ? 'matching'
        : action.category === 'process'
          ? 'process'
          : 'assignment',
    actionUrl: action.actionUrl || '/app/o',
  }));

  const uniqueActions = [...topActions, ...mappedAnalyticsActions].filter(
    (action, index, list) => list.findIndex((item) => item.id === action.id) === index
  );

  return {
    readinessScore,
    scoreBreakdown,
    topActions: uniqueActions.slice(0, 3),
    assignmentReadiness: {
      totalActiveAssignments,
      assignmentWithRequirements,
      assignmentWithVerificationGates,
      assignmentWithClearScope,
    },
    talentAvailabilityInsights,
    marketActivityLow: (matchStatsRow[0]?.totalMatches ?? 0) < 3,
    metrics: {
      totalMatches: matchStatsRow[0]?.totalMatches ?? 0,
      shortlists: shortlistStatsRow[0]?.totalShortlists ?? 0,
      activeAssignments: totalActiveAssignments,
    },
  };
}

export async function getOrganizationReadinessCached(
  orgId: string
): Promise<OrganizationReadiness> {
  return getOrSetTtlCache(
    `${ORGANIZATION_READINESS_CACHE_PREFIX}:${orgId}`,
    () => getOrganizationReadiness(orgId),
    { ttlMs: PLATFORM_PERF_CACHE_TTL_MS }
  );
}
