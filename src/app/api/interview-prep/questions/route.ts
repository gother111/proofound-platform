import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { assignments, interviewPrepQuestions, interviewPrepSessions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { generatePracticeQuestions } from '@/data/interview-prep';

/**
 * POST /api/interview-prep/questions
 * Generates (curated/local) practice questions for a session based on assignment context.
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
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await db.query.interviewPrepSessions.findFirst({
      where: and(
        eq(interviewPrepSessions.id, sessionId),
        eq(interviewPrepSessions.userId, user.id)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, session.assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const questions = generatePracticeQuestions(
      {
        role: assignment.role,
        roleFamily: assignment.role,
        outcomes: assignment.outcomes as any,
        mustHaveSkills: assignment.mustHaveSkills as any,
        niceToHaveSkills: assignment.niceToHaveSkills as any,
      },
      8
    );

    // Replace previous questions for this session
    await db.delete(interviewPrepQuestions).where(eq(interviewPrepQuestions.sessionId, session.id));

    const inserted = await db
      .insert(interviewPrepQuestions)
      .values(
        questions.map((q, idx) => ({
          sessionId: session.id,
          questionType: q.type,
          questionText: q.question,
          contextHint: q.contextHint,
          displayOrder: idx,
        }))
      )
      .returning();

    return NextResponse.json({ questions: inserted });
  } catch (error) {
    console.error('Failed to generate questions', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
