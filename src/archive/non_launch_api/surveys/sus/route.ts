/**
 * SUS Survey API Endpoint
 *
 * PRD: Part 2 (lines 83-84), Part 12
 * Handles submission and retrieval of SUS survey responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { susSurveys, susSurveyPrompts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';
import { trackEvent } from '@/lib/analytics/events';

/**
 * POST /api/surveys/sus
 * Submit a completed SUS survey
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, trigger, responses, score, grade } = body;

    // Validate user matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    if (!trigger || !responses || score === undefined || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate trigger
    const validTriggers = [
      'profile_activation',
      'first_assignment',
      '10_matches',
      'quarterly_checkin',
    ];
    if (!validTriggers.includes(trigger)) {
      return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 });
    }

    // Validate all 10 responses are present and valid
    for (let i = 1; i <= 10; i++) {
      const response = responses[`q${i}`];
      if (response === undefined || response < 1 || response > 5) {
        return NextResponse.json({ error: `Invalid response for question ${i}` }, { status: 400 });
      }
    }

    // Insert survey response
    const [survey] = await db
      .insert(susSurveys)
      .values({
        userId: user.id,
        trigger,
        q1: responses.q1,
        q2: responses.q2,
        q3: responses.q3,
        q4: responses.q4,
        q5: responses.q5,
        q6: responses.q6,
        q7: responses.q7,
        q8: responses.q8,
        q9: responses.q9,
        q10: responses.q10,
        score: score.toString(),
        grade,
      })
      .returning();

    // Update prompt status if one exists
    await db
      .update(susSurveyPrompts)
      .set({
        status: 'completed',
        actionedAt: new Date(),
        surveyId: survey.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(susSurveyPrompts.userId, user.id),
          eq(susSurveyPrompts.trigger, trigger),
          eq(susSurveyPrompts.status, 'pending')
        )
      );

    // Track analytics event
    trackEvent({
      eventType: 'sus_survey_completed',
      entityType: 'custom',
      entityId: survey.id,
      userId: user.id,
      properties: {
        trigger,
        score,
        grade,
        meetsTarget: score >= 75,
      },
    });

    log.info('sus_survey.submitted', {
      surveyId: survey.id,
      userId: user.id,
      trigger,
      score,
      grade,
    });

    return NextResponse.json({
      success: true,
      survey: {
        id: survey.id,
        score,
        grade,
      },
    });
  } catch (error) {
    log.error('sus_survey.submit_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
  }
}

/**
 * GET /api/surveys/sus
 * Get SUS survey history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's survey history
    const surveys = await db
      .select()
      .from(susSurveys)
      .where(eq(susSurveys.userId, user.id))
      .orderBy(desc(susSurveys.createdAt));

    // Calculate average score
    const avgScore =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + parseFloat(s.score), 0) / surveys.length
        : null;

    return NextResponse.json({
      surveys: surveys.map((s) => ({
        id: s.id,
        trigger: s.trigger,
        score: parseFloat(s.score),
        grade: s.grade,
        createdAt: s.createdAt,
      })),
      stats: {
        total: surveys.length,
        averageScore: avgScore,
        meetsTarget: avgScore !== null && avgScore >= 75,
      },
    });
  } catch (error) {
    log.error('sus_survey.get_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Failed to retrieve surveys' }, { status: 500 });
  }
}
