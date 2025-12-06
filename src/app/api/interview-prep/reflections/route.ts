import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { interviewPrepSessions, interviewReflections } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

type ReflectionPayload = {
  sessionId?: string;
  id?: string;
  whatWentWell?: string;
  areasToImprove?: string;
  unexpectedQuestions?: string;
  overallFeeling?: number;
  keyLearnings?: string;
  followUpActions?: string;
  linkedCheckinId?: string | null;
};

const sanitizeFeeling = (value: number | undefined) => {
  if (typeof value !== 'number') return undefined;
  if (value < 1 || value > 5) return undefined;
  return value;
};

const buildUpdateFields = (payload: ReflectionPayload) => {
  const fields: Record<string, any> = {};
  if (payload.whatWentWell !== undefined) fields.whatWentWell = payload.whatWentWell;
  if (payload.areasToImprove !== undefined) fields.areasToImprove = payload.areasToImprove;
  if (payload.unexpectedQuestions !== undefined)
    fields.unexpectedQuestions = payload.unexpectedQuestions;
  const feeling = sanitizeFeeling(payload.overallFeeling);
  if (feeling !== undefined) fields.overallFeeling = feeling;
  if (payload.keyLearnings !== undefined) fields.keyLearnings = payload.keyLearnings;
  if (payload.followUpActions !== undefined) fields.followUpActions = payload.followUpActions;
  if (payload.linkedCheckinId !== undefined) fields.linkedCheckinId = payload.linkedCheckinId;
  return fields;
};

/**
 * POST /api/interview-prep/reflections
 * Creates or upserts a reflection for a session.
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
    const payload: ReflectionPayload = await request.json();
    if (!payload.sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const session = await db.query.interviewPrepSessions.findFirst({
      where: and(
        eq(interviewPrepSessions.id, payload.sessionId),
        eq(interviewPrepSessions.userId, user.id)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const fields = buildUpdateFields(payload);
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No reflection fields provided' }, { status: 400 });
    }

    fields.updatedAt = new Date();

    const existing = await db
      .select()
      .from(interviewReflections)
      .where(eq(interviewReflections.sessionId, session.id))
      .limit(1);

    let reflection;
    if (existing.length > 0) {
      [reflection] = await db
        .update(interviewReflections)
        .set(fields)
        .where(eq(interviewReflections.id, existing[0].id))
        .returning();
    } else {
      [reflection] = await db
        .insert(interviewReflections)
        .values({
          sessionId: session.id,
          ...fields,
        })
        .returning();
    }

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('Failed to save reflection', error);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}

/**
 * PATCH /api/interview-prep/reflections
 * Updates an existing reflection by ID (scoped to current user).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: ReflectionPayload = await request.json();
    if (!payload.id) {
      return NextResponse.json({ error: 'reflection id is required' }, { status: 400 });
    }

    const reflectionRow = await db
      .select({
        id: interviewReflections.id,
        sessionId: interviewReflections.sessionId,
      })
      .from(interviewReflections)
      .innerJoin(
        interviewPrepSessions,
        eq(interviewReflections.sessionId, interviewPrepSessions.id)
      )
      .where(
        and(eq(interviewReflections.id, payload.id), eq(interviewPrepSessions.userId, user.id))
      )
      .limit(1);

    if (reflectionRow.length === 0) {
      return NextResponse.json({ error: 'Reflection not found' }, { status: 404 });
    }

    const fields = buildUpdateFields(payload);
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No reflection fields provided' }, { status: 400 });
    }

    fields.updatedAt = new Date();

    const [reflection] = await db
      .update(interviewReflections)
      .set(fields)
      .where(eq(interviewReflections.id, payload.id))
      .returning();

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error('Failed to update reflection', error);
    return NextResponse.json({ error: 'Failed to update reflection' }, { status: 500 });
  }
}
