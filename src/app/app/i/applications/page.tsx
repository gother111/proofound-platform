import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { applicationTimeline, applicationStages, assignments } from '@/db/schema';
import { ApplicationTimeline } from '@/components/applications/ApplicationTimeline';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const user = await requireAuth();

  const timelines = await db
    .select({
      id: applicationTimeline.id,
      assignmentId: applicationTimeline.assignmentId,
      currentStageCode: applicationTimeline.currentStageCode,
      stageHistory: applicationTimeline.stageHistory,
      expectedDecisionDate: applicationTimeline.expectedDecisionDate,
      outcome: applicationTimeline.outcome,
      updatedAt: applicationTimeline.updatedAt,
      assignmentRole: assignments.role,
    })
    .from(applicationTimeline)
    .innerJoin(assignments, eq(applicationTimeline.assignmentId, assignments.id))
    .where(eq(applicationTimeline.profileId, user.id))
    .orderBy(asc(applicationTimeline.updatedAt));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Status</h1>
        <p className="text-sm text-muted-foreground">
          Track each application from received to decision, with expected timeframes.
        </p>
      </div>

      {timelines.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-6">
          <p className="text-sm text-muted-foreground">
            No applications yet. Express interest in an assignment to start a timeline.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timelines.map((timeline) => (
          <ApplicationTimeline
            key={timeline.id}
            timelineId={timeline.id}
            assignmentRole={timeline.assignmentRole || undefined}
          />
        ))}
      </div>
    </div>
  );
}
