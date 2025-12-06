import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { interviewPrepQuestions, interviewPrepSessions, interviews } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

type RouteParams = {
  params: { id: string };
};

const allowedStatuses = ['not_started', 'in_progress', 'completed'] as const;

/**
 * GET /api/interview-prep/sessions/[id]
 * Returns a session plus its stored practice questions.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await db.query.interviewPrepSessions.findFirst({
      where: and(
        eq(interviewPrepSessions.id, params.id),
        eq(interviewPrepSessions.userId, user.id)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const questions = await db
      .select()
      .from(interviewPrepQuestions)
      .where(eq(interviewPrepQuestions.sessionId, session.id))
      .orderBy(interviewPrepQuestions.displayOrder);

    return NextResponse.json({ session, questions });
  } catch (error) {
    console.error('Failed to load session', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

/**
 * PATCH /api/interview-prep/sessions/[id]
 * Updates session status/progress flags.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const updates: {
      status?: (typeof allowedStatuses)[number];
      tipsViewed?: boolean;
      questionsPracticed?: number;
      updatedAt?: Date;
    } = {};

    if (payload.status) {
      if (!allowedStatuses.includes(payload.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = payload.status;
    }
    if (typeof payload.tipsViewed === 'boolean') updates.tipsViewed = payload.tipsViewed;
    if (typeof payload.questionsPracticed === 'number')
      updates.questionsPracticed = Math.max(0, payload.questionsPracticed);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [session] = await db
      .update(interviewPrepSessions)
      .set(updates)
      .where(
        and(eq(interviewPrepSessions.id, params.id), eq(interviewPrepSessions.userId, user.id))
      )
      .returning();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Failed to update session', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

/**
 * DELETE /api/interview-prep/sessions/[id]
 * Removes a session and cascades questions/reflections.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await db
      .delete(interviewPrepSessions)
      .where(
        and(eq(interviewPrepSessions.id, params.id), eq(interviewPrepSessions.userId, user.id))
      )
      .returning({ id: interviewPrepSessions.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
