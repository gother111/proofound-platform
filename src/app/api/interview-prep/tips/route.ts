import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { buildPrepTips, questionTypeDescriptions } from '@/data/interview-prep';

export const runtime = 'nodejs';

/**
 * GET /api/interview-prep/tips?assignmentId=...
 * Returns contextual prep tips for the current user's assignment.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    const match = await db
      .select({ id: matches.id })
      .from(matches)
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, user.id)))
      .limit(1);

    if (match.length === 0) {
      return NextResponse.json({ error: 'Assignment not accessible' }, { status: 403 });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const tips = buildPrepTips({
      role: assignment.role,
      mustHaveSkills: assignment.mustHaveSkills as any,
      niceToHaveSkills: assignment.niceToHaveSkills as any,
      outcomes: assignment.outcomes as any,
    });

    return NextResponse.json({
      tips,
      questionTypes: questionTypeDescriptions,
      meta: {
        role: assignment.role,
        outcomes: assignment.outcomes,
        mustHaveSkills: assignment.mustHaveSkills,
      },
    });
  } catch (error) {
    console.error('Failed to load tips', error);
    return NextResponse.json({ error: 'Failed to load tips' }, { status: 500 });
  }
}
