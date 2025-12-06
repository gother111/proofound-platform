import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { assignments, interviewPrepSessions, interviews, matches } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/interview-prep/sessions
 * Returns prep sessions (or eligible interviews) for the current user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select({
        sessionId: interviewPrepSessions.id,
        sessionStatus: interviewPrepSessions.status,
        tipsViewed: interviewPrepSessions.tipsViewed,
        questionsPracticed: interviewPrepSessions.questionsPracticed,
        isPrivate: interviewPrepSessions.isPrivate,
        sessionCreatedAt: interviewPrepSessions.createdAt,
        sessionUpdatedAt: interviewPrepSessions.updatedAt,
        interviewId: interviews.id,
        interviewStatus: interviews.status,
        interviewScheduledAt: interviews.scheduledAt,
        interviewDuration: interviews.duration,
        interviewPlatform: interviews.platform,
        interviewMeetingUrl: interviews.meetingUrl,
        matchId: interviews.matchId,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
        assignmentOutcomes: assignments.outcomes,
        assignmentMustHave: assignments.mustHaveSkills,
        assignmentNiceToHave: assignments.niceToHaveSkills,
      })
      .from(interviews)
      .innerJoin(matches, eq(interviews.matchId, matches.id))
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .leftJoin(
        interviewPrepSessions,
        and(
          eq(interviewPrepSessions.interviewId, interviews.id),
          eq(interviewPrepSessions.userId, matches.profileId)
        )
      )
      .where(eq(matches.profileId, user.id))
      .orderBy(desc(interviews.scheduledAt));

    const sessions = rows.map((row) => ({
      session: row.sessionId
        ? {
            id: row.sessionId,
            status: row.sessionStatus,
            tipsViewed: row.tipsViewed,
            questionsPracticed: row.questionsPracticed,
            isPrivate: row.isPrivate,
            createdAt: row.sessionCreatedAt,
            updatedAt: row.sessionUpdatedAt,
          }
        : null,
      interview: {
        id: row.interviewId,
        status: row.interviewStatus,
        scheduledAt: row.interviewScheduledAt,
        duration: row.interviewDuration,
        platform: row.interviewPlatform,
        meetingUrl: row.interviewMeetingUrl,
        matchId: row.matchId,
      },
      assignment: {
        id: row.assignmentId,
        role: row.assignmentRole,
        outcomes: row.assignmentOutcomes,
        mustHaveSkills: row.assignmentMustHave,
        niceToHaveSkills: row.assignmentNiceToHave,
      },
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch prep sessions', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

/**
 * POST /api/interview-prep/sessions
 * Creates a prep session for a specific interview (one per interview per user).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { interviewId } = await request.json();

    if (!interviewId || typeof interviewId !== 'string') {
      return NextResponse.json({ error: 'interviewId is required' }, { status: 400 });
    }

    // Verify the interview belongs to the current user via match.profile_id
    const interviewRow = await db
      .select({
        id: interviews.id,
        assignmentId: assignments.id,
        matchProfileId: matches.profileId,
      })
      .from(interviews)
      .innerJoin(matches, eq(interviews.matchId, matches.id))
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .where(eq(interviews.id, interviewId))
      .limit(1);

    const ownedInterview = interviewRow[0];
    if (!ownedInterview || ownedInterview.matchProfileId !== user.id) {
      return NextResponse.json({ error: 'Interview not found for user' }, { status: 404 });
    }

    // Prevent duplicate session
    const existing = await db
      .select({ id: interviewPrepSessions.id })
      .from(interviewPrepSessions)
      .where(
        and(
          eq(interviewPrepSessions.userId, user.id),
          eq(interviewPrepSessions.interviewId, interviewId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Session already exists for this interview' },
        { status: 409 }
      );
    }

    const [session] = await db
      .insert(interviewPrepSessions)
      .values({
        userId: user.id,
        interviewId,
        assignmentId: ownedInterview.assignmentId,
        status: 'not_started',
      })
      .returning();

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Failed to create prep session', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
