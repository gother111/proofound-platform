import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  applicationTimeline,
  applicationStages,
  assignments,
  organizationMembers,
  organizations,
} from '@/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { notifyApplicationStageUpdated } from '@/lib/notifications';

type StageRow = typeof applicationStages.$inferSelect;

export const dynamic = 'force-dynamic';

async function getOrgWithAccess(orgIdOrSlug: string, userId: string) {
  const org = await db.query.organizations.findFirst({
    where: sql`${organizations.id}::text = ${orgIdOrSlug} OR ${organizations.slug} = ${orgIdOrSlug}`,
  });

  if (!org) {
    return { org: null, membership: null };
  }

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, org.id),
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return { org, membership };
}

async function computeExpectedDecisionDate(stageCode: string) {
  const stages = await db
    .select()
    .from(applicationStages)
    .orderBy(asc(applicationStages.displayOrder));
  const ordered: StageRow[] = [...stages].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
  const startIndex = ordered.findIndex((s) => s.code === stageCode);
  const today = new Date();

  if (startIndex === -1) {
    return today;
  }

  const remainingDays = ordered.slice(startIndex).reduce((sum: number, stage) => {
    return sum + (stage.defaultDaysToComplete ?? 0);
  }, 0);

  const result = new Date(today);
  result.setDate(result.getDate() + remainingDays);
  return result;
}

function updateStageHistory(
  existing: any,
  newStage: string,
  notes?: string
): Array<Record<string, any>> {
  const history: Array<Record<string, any>> = Array.isArray(existing) ? [...existing] : [];
  const now = new Date().toISOString();

  if (history.length > 0 && !history[history.length - 1].exited_at) {
    history[history.length - 1].exited_at = now;
  }

  history.push({
    stage: newStage,
    entered_at: now,
    notes: notes || undefined,
  });

  return history;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, appId } = await params;
    const body = await request.json();

    const { stageCode, notes, outcome, outcomeReason } = body as {
      stageCode?: string;
      notes?: string;
      outcome?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
      outcomeReason?: string;
    };

    if (!stageCode) {
      return NextResponse.json({ error: 'stageCode is required' }, { status: 400 });
    }

    const { org, membership } = await getOrgWithAccess(id, user.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const stage = await db.query.applicationStages.findFirst({
      where: eq(applicationStages.code, stageCode),
    });

    if (!stage) {
      return NextResponse.json({ error: 'Invalid stage code' }, { status: 400 });
    }

    const timeline = await db
      .select({
        id: applicationTimeline.id,
        profileId: applicationTimeline.profileId,
        assignmentId: applicationTimeline.assignmentId,
        stageHistory: applicationTimeline.stageHistory,
        outcome: applicationTimeline.outcome,
      })
      .from(applicationTimeline)
      .innerJoin(assignments, eq(applicationTimeline.assignmentId, assignments.id))
      .where(and(eq(applicationTimeline.id, appId), eq(assignments.orgId, org.id)))
      .limit(1);

    if (timeline.length === 0) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    const timelineRow = timeline[0];
    const updatedHistory = updateStageHistory(timelineRow.stageHistory, stageCode, notes);
    const expectedDecisionDate = await computeExpectedDecisionDate(stageCode);

    const [updated] = await db
      .update(applicationTimeline)
      .set({
        currentStageCode: stageCode,
        stageHistory: updatedHistory,
        expectedDecisionDate: expectedDecisionDate ?? null,
        outcome: outcome || timelineRow.outcome,
        outcomeReason: outcomeReason || null,
        updatedAt: new Date(),
      })
      .where(eq(applicationTimeline.id, timelineRow.id))
      .returning();

    await notifyApplicationStageUpdated(
      timelineRow.profileId,
      timelineRow.assignmentId,
      stage.label,
      expectedDecisionDate?.toISOString()
    );

    return NextResponse.json({ timeline: updated });
  } catch (error) {
    console.error('applications.timeline.stage_update.failed', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
