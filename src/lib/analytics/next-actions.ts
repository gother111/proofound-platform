/**
 * Next Actions Calculator
 *
 * Generates intelligent action recommendations based on assignment and matching data.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';

export interface NextAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'assignment' | 'candidate' | 'matching' | 'process';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Calculate suggested next actions for an organization
 */
export async function calculateNextActions(organizationId: string): Promise<NextAction[]> {
  const actions: NextAction[] = [];
  const now = new Date();

  // 1. Check for stale assignments (>14 days, no shortlist)
  const staleAssignments = await db.query.assignments.findMany({
    where: and(
      eq(assignments.orgId, organizationId),
      eq(assignments.status, 'active'),
      lt(assignments.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
    ),
  });

  for (const assignment of staleAssignments) {
    // Check if there are any matches for this assignment
    const matchCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(eq(matches.assignmentId, assignment.id));

    if (!matchCount[0] || parseInt(matchCount[0].count.toString()) === 0) {
      actions.push({
        id: `stale-assignment-${assignment.id}`,
        priority: 'high',
        category: 'assignment',
        title: 'No matches for assignment',
        description: `"${assignment.role || 'Untitled'}" has been active for 14+ days with no matches. Consider adjusting criteria.`,
        actionLabel: 'Review Criteria',
        actionUrl: `/o/${assignment.orgId}/assignments/${assignment.id}/edit`,
        metadata: { assignmentId: assignment.id },
      });
    }
  }

  /*
  // 2. Check for pending candidate reviews
  // TODO: Re-enable when applications table is defined
  const pendingApplications = await db.execute(sql`
    SELECT 
      COUNT(*) as pending_count,
      a.id as assignment_id,
      a.role
    FROM applications app
    JOIN ${assignments} a ON app.assignment_id = a.id
    WHERE a.organization_id = ${organizationId}
      AND app.status = 'pending'
      AND app.created_at < ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)}
    GROUP BY a.id, a.role
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC
    LIMIT 3
  `);

  for (const row of pendingApplications.rows as any[]) {
    const count = parseInt(row.pending_count);
    if (count > 0) {
      actions.push({
        id: `pending-reviews-${row.assignment_id}`,
        priority: count > 5 ? 'critical' : 'high',
        category: 'candidate',
        title: `${count} ${count === 1 ? 'candidate' : 'candidates'} awaiting review`,
        description: `${row.role || 'Untitled assignment'} has ${count} applications pending for 3+ days.`,
        actionLabel: 'Review Candidates',
        actionUrl: `/o/${organizationId}/assignments/${row.assignment_id}/candidates`,
        metadata: { assignmentId: row.assignment_id, count },
      });
    }
  }
  */

  // 3. Check for low match quality (average score <0.5)
  const lowQualityAssignments = await db.execute(sql`
    SELECT 
      a.id as assignment_id,
      a.role,
      AVG(CAST(m.score AS FLOAT)) as avg_score,
      COUNT(m.id) as match_count
    FROM ${assignments} a
    LEFT JOIN ${matches} m ON m.assignment_id = a.id
    WHERE a.organization_id = ${organizationId}
      AND a.status = 'active'
    GROUP BY a.id, a.role
    HAVING AVG(CAST(m.score AS FLOAT)) < 0.5 AND COUNT(m.id) >= 5
    LIMIT 2
  `);

  for (const row of lowQualityAssignments as unknown as any[]) {
    const avgScore = Math.round(parseFloat(row.avg_score) * 100);
    actions.push({
      id: `low-quality-${row.assignment_id}`,
      priority: 'medium',
      category: 'matching',
      title: 'Low match quality detected',
      description: `"${row.role || 'Untitled'}" has an average match score of ${avgScore}%. Consider adjusting weight matrix.`,
      actionLabel: 'Adjust Weights',
      actionUrl: `/o/${organizationId}/assignments/${row.assignment_id}/edit?tab=weights`,
      metadata: { assignmentId: row.assignment_id, avgScore },
    });
  }

  /*
  // 4. Check for drop-off patterns (high application rate, low interview rate)
  // TODO: Re-enable when applications table is defined
  const dropOffAnalysis = await db.execute(sql`
    WITH assignment_funnel AS (
      SELECT 
        a.id as assignment_id,
        a.role,
        COUNT(DISTINCT CASE WHEN app.status = 'submitted' THEN app.id END) as applications,
        COUNT(DISTINCT CASE WHEN app.status = 'interview_scheduled' THEN app.id END) as interviews
      FROM ${assignments} a
      LEFT JOIN applications app ON app.assignment_id = a.id
      WHERE a.organization_id = ${organizationId}
        AND a.created_at >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
      GROUP BY a.id, a.role
    )
    SELECT 
      assignment_id,
      role,
      applications,
      interviews,
      CASE 
        WHEN applications > 0 THEN (interviews::float / applications::float)
        ELSE 0
      END as conversion_rate
    FROM assignment_funnel
    WHERE applications >= 10 
      AND (interviews::float / NULLIF(applications, 0)::float) < 0.2
    LIMIT 2
  `);

  for (const row of dropOffAnalysis.rows as any[]) {
    const conversionRate = Math.round(parseFloat(row.conversion_rate) * 100);
    actions.push({
      id: `high-dropoff-${row.assignment_id}`,
      priority: 'medium',
      category: 'process',
      title: 'High drop-off rate detected',
      description: `Only ${conversionRate}% of applicants reach interview stage for "${row.role}". Consider simplifying your application process.`,
      actionLabel: 'Review Process',
      actionUrl: `/o/${organizationId}/assignments/${row.assignment_id}`,
      metadata: { assignmentId: row.assignment_id, conversionRate },
    });
  }
  */

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return top 5 actions
  return actions.slice(0, 5);
}
