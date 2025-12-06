import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { applicationTimeline, applicationStages, assignments } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const timeline = await db.query.applicationTimeline.findFirst({
      where: eq(applicationTimeline.id, id),
    });

    if (!timeline || timeline.profileId !== user.id) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, timeline.assignmentId),
    });

    const stages = await db
      .select()
      .from(applicationStages)
      .orderBy(asc(applicationStages.displayOrder));

    const currentStage = stages.find((stage) => stage.code === timeline.currentStageCode) || null;

    return NextResponse.json({
      timeline: {
        ...timeline,
        assignment,
        currentStage,
      },
      stages,
    });
  } catch (error) {
    console.error('applications.timeline.detail.failed', error);
    return NextResponse.json({ error: 'Failed to fetch application timeline' }, { status: 500 });
  }
}
