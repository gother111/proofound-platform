import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, growthPlans, interviews, matches, notifications } from '@/db/schema';
import type { ActivityEvent, ActivityEventType } from '@/lib/momentum/types';
import { listCanonicalBundlesForOwner } from '@/lib/verification/canonical-bundles';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  mapCanonicalSkillVerificationRequestRecord,
} from '@/lib/verification/canonical-requests';
import {
  listCanonicalImpactVerificationRequestsForOwner,
  mapCanonicalImpactVerificationRequestRecord,
} from '@/lib/verification/canonical-impact-requests';

const DEFAULT_LIMIT = 8;

function mapNotificationType(type: string): ActivityEventType {
  switch (type) {
    case 'match_suggested':
      return 'new_match';
    case 'message_received':
      return 'message';
    case 'interview_scheduled':
      return 'interview';
    case 'verification_requested':
    case 'verification_completed':
      return 'verification_update';
    default:
      return 'profile_progress';
  }
}

function asEventTimestamp(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  if (typeof value === 'string') return new Date(value).toISOString();
  return value.toISOString();
}

function byNewest(a: ActivityEvent, b: ActivityEvent): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

type VerificationActivityRow = {
  id: string;
  subjectType: 'skill' | 'impact_story' | 'custom_bundle';
  status: string;
  respondedAt: string | null;
  createdAt: string;
};

export async function getIndividualActivityEvents(
  userId: string,
  limit: number = DEFAULT_LIMIT
): Promise<ActivityEvent[]> {
  const [notificationRows, goalRows, verificationRows, interviewRows] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        actionUrl: notifications.actionUrl,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(Math.max(limit, 6)),

    db
      .select({
        id: growthPlans.id,
        title: growthPlans.title,
        status: growthPlans.status,
        updatedAt: growthPlans.updatedAt,
      })
      .from(growthPlans)
      .where(eq(growthPlans.profileId, userId))
      .orderBy(desc(growthPlans.updatedAt))
      .limit(3),

    Promise.all([
      listCanonicalSkillVerificationRequestsForOwner(userId).catch(() => []),
      listCanonicalImpactVerificationRequestsForOwner(userId).catch(() => []),
      listCanonicalBundlesForOwner(userId).catch(() => []),
    ]).then(([skillRows, impactRows, bundleRows]) => {
      const standaloneSkillRows = skillRows
        .map(mapCanonicalSkillVerificationRequestRecord)
        .filter((row) => !row.custom_request_id)
        .map(
          (row): VerificationActivityRow => ({
            id: row.id,
            subjectType: 'skill',
            status: row.status,
            respondedAt: row.responded_at,
            createdAt: row.created_at,
          })
        );
      const standaloneImpactRows = impactRows
        .map(mapCanonicalImpactVerificationRequestRecord)
        .filter((row) => !row.custom_request_id)
        .map(
          (row): VerificationActivityRow => ({
            id: row.id,
            subjectType: 'impact_story',
            status: row.status,
            respondedAt: row.responded_at,
            createdAt: row.created_at,
          })
        );
      const bundleActivityRows = bundleRows.map(
        (row): VerificationActivityRow => ({
          id: row.id,
          subjectType: 'custom_bundle',
          status: row.status,
          respondedAt: row.responded_at,
          createdAt: row.created_at,
        })
      );

      return [...standaloneSkillRows, ...standaloneImpactRows, ...bundleActivityRows]
        .sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )
        .slice(0, 3);
    }),

    db
      .select({
        interviewId: interviews.id,
        scheduledAt: interviews.scheduledAt,
        status: interviews.status,
      })
      .from(interviews)
      .innerJoin(matches, eq(interviews.matchId, matches.id))
      .where(eq(matches.profileId, userId))
      .orderBy(desc(interviews.scheduledAt))
      .limit(2),
  ]);

  const events: ActivityEvent[] = [];

  for (const row of notificationRows) {
    events.push({
      id: `notification-${row.id}`,
      type: mapNotificationType(row.type),
      text: `${row.title}: ${row.message}`,
      timestamp: asEventTimestamp(row.createdAt),
      actionUrl: row.actionUrl || undefined,
    });
  }

  for (const row of goalRows) {
    events.push({
      id: `goal-${row.id}`,
      type: 'goal_progress',
      text: `Goal update: ${row.title} is now ${row.status.replace('_', ' ')}`,
      timestamp: asEventTimestamp(row.updatedAt),
      actionUrl: '/app/i/growth/goals',
    });
  }

  for (const row of verificationRows) {
    const state = row.status.replace('_', ' ');
    const eventTime = row.respondedAt || row.createdAt;
    const text =
      row.subjectType === 'custom_bundle'
        ? `Custom verification bundle ${state}`
        : row.subjectType === 'impact_story'
          ? `Impact story verification request ${state}`
          : `Skill verification request ${state}`;
    events.push({
      id: `verification-${row.id}`,
      type: 'verification_update',
      text,
      timestamp: asEventTimestamp(eventTime),
      actionUrl: '/app/i/verifications',
    });
  }

  for (const row of interviewRows) {
    const label = row.status === 'scheduled' ? 'Interview scheduled' : `Interview ${row.status}`;
    events.push({
      id: `interview-${row.interviewId}`,
      type: 'interview',
      text: label,
      timestamp: asEventTimestamp(row.scheduledAt),
      actionUrl: '/app/i/communications?section=interviews',
    });
  }

  const sorted = events.sort(byNewest);
  return sorted.slice(0, limit);
}

export async function getOrganizationActivityEvents(
  orgId: string,
  limit: number = DEFAULT_LIMIT
): Promise<ActivityEvent[]> {
  const [assignmentRows, matchRows, interviewRows] = await Promise.all([
    db
      .select({
        id: assignments.id,
        role: assignments.role,
        status: assignments.status,
        updatedAt: assignments.updatedAt,
      })
      .from(assignments)
      .where(eq(assignments.orgId, orgId))
      .orderBy(desc(assignments.updatedAt))
      .limit(Math.max(limit, 6)),

    db
      .select({
        id: matches.id,
        assignmentId: matches.assignmentId,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .where(eq(assignments.orgId, orgId))
      .orderBy(desc(matches.createdAt))
      .limit(4),

    db
      .select({
        id: interviews.id,
        scheduledAt: interviews.scheduledAt,
        status: interviews.status,
      })
      .from(interviews)
      .innerJoin(matches, eq(interviews.matchId, matches.id))
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .where(eq(assignments.orgId, orgId))
      .orderBy(desc(interviews.scheduledAt))
      .limit(3),
  ]);

  const events: ActivityEvent[] = [];

  for (const row of assignmentRows) {
    events.push({
      id: `assignment-${row.id}`,
      type: 'assignment_readiness',
      text: `Assignment ${row.role} is ${row.status}`,
      timestamp: asEventTimestamp(row.updatedAt),
      actionUrl: '/app/o',
    });
  }

  for (const row of matchRows) {
    events.push({
      id: `org-match-${row.id}`,
      type: 'new_match',
      text: 'New proof-submission match generated',
      timestamp: asEventTimestamp(row.createdAt),
      actionUrl: '/app/o',
      metadata: { assignmentId: row.assignmentId },
    });
  }

  for (const row of interviewRows) {
    events.push({
      id: `org-interview-${row.id}`,
      type: 'interview',
      text: `Interview ${row.status}`,
      timestamp: asEventTimestamp(row.scheduledAt),
      actionUrl: '/app/o',
    });
  }

  return events.sort(byNewest).slice(0, limit);
}

export async function getOrgIdsForUser(userId: string): Promise<string[]> {
  const rows = await db.execute(sql`
    SELECT org_id
    FROM organization_members
    WHERE user_id = ${userId}
      AND state = 'active'
    ORDER BY joined_at DESC
    LIMIT 5
  `);

  const result = (rows as { rows?: Array<{ org_id: string }> }).rows || [];
  return result.map((row) => row.org_id);
}

export async function getLatestOrgIdForUser(userId: string): Promise<string | null> {
  const orgIds = await getOrgIdsForUser(userId);
  return orgIds.length > 0 ? orgIds[0] : null;
}

export async function getNewMatchCountForOrg(orgId: string): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(${matches.id})::int`,
    })
    .from(matches)
    .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
    .where(eq(assignments.orgId, orgId));

  return row?.count ?? 0;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({
      count: sql<number>`count(${notifications.id})::int`,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

  return row?.count ?? 0;
}

export async function getLatestNotificationsByUsers(userIds: string[], limit: number) {
  if (userIds.length === 0) return [];

  return db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      actionUrl: notifications.actionUrl,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(inArray(notifications.userId, userIds))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
