import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { applicationTimeline, applicationStages, assignments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();

    const timelines = await db
      .select({
        id: applicationTimeline.id,
        assignmentId: applicationTimeline.assignmentId,
        currentStageCode: applicationTimeline.currentStageCode,
        stageHistory: applicationTimeline.stageHistory,
        expectedDecisionDate: applicationTimeline.expectedDecisionDate,
        outcome: applicationTimeline.outcome,
        outcomeReason: applicationTimeline.outcomeReason,
        updatedAt: applicationTimeline.updatedAt,
        assignmentRole: assignments.role,
        assignmentStatus: assignments.status,
        stageLabel: applicationStages.label,
        stageDescription: applicationStages.description,
        stageColor: applicationStages.color,
        stageIcon: applicationStages.icon,
        stageOrder: applicationStages.displayOrder,
        stageDefaultDays: applicationStages.defaultDaysToComplete,
      })
      .from(applicationTimeline)
      .innerJoin(assignments, eq(applicationTimeline.assignmentId, assignments.id))
      .innerJoin(
        applicationStages,
        eq(applicationTimeline.currentStageCode, applicationStages.code)
      )
      .where(eq(applicationTimeline.profileId, user.id))
      .orderBy(asc(applicationStages.displayOrder));

    return NextResponse.json({ items: timelines });
  } catch (error) {
    console.error('applications.timeline.get.failed', error);
    return NextResponse.json({ error: 'Failed to fetch application timelines' }, { status: 500 });
  }
}
