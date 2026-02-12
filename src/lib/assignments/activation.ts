import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, matches, organizations } from '@/db/schema';
import { emitAssignmentPublished } from '@/lib/analytics/events';
import { log } from '@/lib/log';
import { generateMatchesForAssignment } from '@/lib/matching/generate-matches-for-assignment';
import { notifyAssignmentPublished } from '@/lib/notifications';

type AssignmentRecord = typeof assignments.$inferSelect;

type AssignmentActivationSnapshot = Pick<
  AssignmentRecord,
  | 'status'
  | 'role'
  | 'description'
  | 'mustHaveSkills'
  | 'locationMode'
  | 'country'
  | 'compMin'
  | 'compMax'
>;

export type AssignmentActivationEvaluation = {
  hasCompleteDetails: boolean;
  hasMinimumSkills: boolean;
  mustHaveSkillsCount: number;
  hasLocationAndComp: boolean;
  canActivate: boolean;
};

export type AssignmentActivationContext = {
  assignmentId: string;
  orgId: string;
  createdAt: Date;
  userId: string;
};

const activatedAssignments = new Set<string>();

export function evaluateAssignmentActivationCriteria(
  assignment: AssignmentActivationSnapshot
): AssignmentActivationEvaluation {
  const hasCompleteDetails = !!assignment.role && !!assignment.description;
  const mustHaveSkills = (assignment.mustHaveSkills as any[]) || [];
  const hasMinimumSkills = mustHaveSkills.length >= 5;
  const hasLocationAndComp =
    Boolean(assignment.locationMode || assignment.country) &&
    (assignment.compMin !== null || assignment.compMax !== null);

  return {
    hasCompleteDetails,
    hasMinimumSkills,
    mustHaveSkillsCount: mustHaveSkills.length,
    hasLocationAndComp,
    canActivate:
      assignment.status === 'active' &&
      hasCompleteDetails &&
      hasMinimumSkills &&
      hasLocationAndComp,
  };
}

/**
 * Emits assignment activation analytics and notifications exactly once per process.
 */
export async function checkAndEmitAssignmentActivation({
  assignmentId,
  orgId,
  createdAt,
  userId,
}: AssignmentActivationContext): Promise<void> {
  if (activatedAssignments.has(assignmentId)) {
    return;
  }

  try {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return;
    }

    const evaluation = evaluateAssignmentActivationCriteria(assignment);
    if (!evaluation.canActivate) {
      return;
    }

    const publishTime = Date.now() - createdAt.getTime();
    const publishTimeMinutes = Math.floor(publishTime / (1000 * 60));
    const publishedWithinTimeTarget = publishTimeMinutes <= 15;

    await emitAssignmentPublished(userId, assignmentId, orgId, {
      hasCompleteDetails: evaluation.hasCompleteDetails,
      hasMinimumSkills: evaluation.hasMinimumSkills,
      mustHaveSkillsCount: evaluation.mustHaveSkillsCount,
      hasLocationAndComp: evaluation.hasLocationAndComp,
      publishTimeMinutes,
      publishedWithinTimeTarget,
    });

    activatedAssignments.add(assignmentId);

    const matchesGenerated = await generateMatchesForAssignment(assignmentId, {
      replaceExisting: true,
    });

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    const orgName = org?.displayName || 'An organization';

    if (matchesGenerated > 0) {
      const topMatches = await db.query.matches.findMany({
        where: eq(matches.assignmentId, assignmentId),
        orderBy: (t: any, { desc }) => [desc(t.score)],
        limit: 10,
      });

      for (const match of topMatches) {
        try {
          await notifyAssignmentPublished(match.profileId, assignmentId, assignment.role, orgName);
        } catch (notifyError) {
          log.error('assignment.notification.failed', {
            profileId: match.profileId,
            assignmentId,
            error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
          });
        }
      }

      log.info('assignment.notifications.sent', {
        assignmentId,
        notificationsSent: topMatches.length,
      });
    }
  } catch (error) {
    log.error('assignment-activation-check.failed', {
      assignmentId,
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
