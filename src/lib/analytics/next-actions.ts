/**
 * Organization readiness next actions
 *
 * Generates proof-first readiness actions based on assignment and submission data.
 * PRD Reference: Organization assignment-review readiness
 */

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { getRows } from '@/lib/db/rows';

export interface NextAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'assignment' | 'matching' | 'process';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Calculate proof-first next actions for an organization.
 */
export async function calculateNextActions(
  organizationId: string,
  organizationSlug?: string | null
): Promise<NextAction[]> {
  const actions: NextAction[] = [];
  const orgAssignmentPath = organizationSlug
    ? `/app/o/${encodeURIComponent(organizationSlug)}/assignments`
    : '/app/o';
  const assignmentReviewPath = (assignmentId: string) =>
    organizationSlug
      ? `${orgAssignmentPath}/${encodeURIComponent(assignmentId)}/review`
      : orgAssignmentPath;

  // 1. Check for stale assignments (>14 days, no proof submissions).
  const staleAssignments = await db.query.assignments.findMany({
    where: and(
      eq(assignments.orgId, organizationId),
      eq(assignments.status, 'active'),
      lt(assignments.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
    ),
  });

  for (const assignment of staleAssignments) {
    // Check if there are any proof-submission matches for this assignment.
    const matchCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(eq(matches.assignmentId, assignment.id));

    if (!matchCount[0] || parseInt(matchCount[0].count.toString()) === 0) {
      actions.push({
        id: `stale-assignment-${assignment.id}`,
        priority: 'high',
        category: 'assignment',
        title: 'Assignment needs proof-submission context',
        description: `"${assignment.role || 'Untitled'}" has been active for 14+ days without proof submissions. Review assignment scope, proof expectations, or publish readiness.`,
        actionLabel: 'Review assignment',
        actionUrl: assignmentReviewPath(assignment.id),
        metadata: { assignmentId: assignment.id },
      });
    }
  }

  // 2. Check for weak proof-alignment bands without exposing raw score artifacts.
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
    actions.push({
      id: `low-quality-${row.assignment_id}`,
      priority: 'medium',
      category: 'matching',
      title: 'Proof alignment needs review',
      description: `"${row.role || 'Untitled'}" is producing weak proof-alignment signals. Tighten required skills, proof gates, or assignment scope.`,
      actionLabel: 'Review assignment',
      actionUrl: assignmentReviewPath(row.assignment_id),
      metadata: { assignmentId: row.assignment_id, proofAlignmentState: 'weak' },
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Return top 5 actions
  return actions.slice(0, 5);
}
