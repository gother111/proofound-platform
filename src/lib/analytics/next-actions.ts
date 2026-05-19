/**
 * Next Actions Calculator
 *
 * Generates intelligent action recommendations based on assignment and matching data.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';

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
        actionUrl: `/o/${organizationId}/assignments/${assignment.id}/edit`,
        metadata: { assignmentId: assignment.id },
      });
    }
  }

  // 2. Check for low match quality (average score <0.5)
  const lowQualityAssignments = await db.execute(sql`
    SELECT 
      a.id as assignment_id,
      a.role,
      AVG(CAST(m.score AS FLOAT)) as avg_score,
      COUNT(m.id) as match_count
    FROM ${assignments} a
    LEFT JOIN ${matches} m ON m.assignment_id = a.id
    WHERE a.org_id = ${organizationId}
      AND a.status = 'active'
    GROUP BY a.id, a.role
    HAVING AVG(CAST(m.score AS FLOAT)) < 0.5 AND COUNT(m.id) >= 5
    LIMIT 2
  `);

  for (const row of getRows(lowQualityAssignments) as any[]) {
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

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return top 5 actions
  return actions.slice(0, 5);
}
