/**
 * SUS Survey Submission API
 *
 * POST /api/surveys/sus
 * Stores SUS survey responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { emitSUSCompleted } from '@/lib/analytics/events';
import { log } from '@/lib/log';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { responses, totalScore, triggerPoint } = body;

    if (!responses || typeof totalScore !== 'number') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate SUS score range (0-100)
    if (totalScore < 0 || totalScore > 100) {
      return NextResponse.json({ error: 'Invalid SUS score' }, { status: 400 });
    }

    // Store in database
    await db.execute(sql`
      INSERT INTO sus_responses (
        user_id,
        q1_score, q2_score, q3_score, q4_score, q5_score,
        q6_score, q7_score, q8_score, q9_score, q10_score,
        total_score,
        trigger_point
      ) VALUES (
        ${user.id},
        ${responses[1]}, ${responses[2]}, ${responses[3]}, ${responses[4]}, ${responses[5]},
        ${responses[6]}, ${responses[7]}, ${responses[8]}, ${responses[9]}, ${responses[10]},
        ${totalScore},
        ${triggerPoint || 'manual'}
      )
    `);

    // Emit analytics event
    await emitSUSCompleted(user.id, {
      total_score: totalScore,
      individual_scores: Object.values(responses),
      trigger_point: triggerPoint || 'manual',
    });

    log.info('sus.survey.submitted', {
      userId: user.id,
      totalScore,
      triggerPoint,
    });

    const response = NextResponse.json({
      success: true,
      totalScore,
      message: 'Thank you for your feedback!',
    });

    // Add user ID to response header for analytics event
    response.headers.set('x-user-id', user.id);

    return response;
  } catch (error) {
    log.error('sus.survey.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to submit survey' }, { status: 500 });
  }
}
