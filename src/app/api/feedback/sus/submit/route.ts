/**
 * SUS Survey Submission API
 * POST /api/feedback/sus/submit
 *
 * Submits completed SUS survey and calculates score
 *
 * PRD References:
 * - Part 2: SUS target ≥75
 * - Part 7: Survey data collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { calculateSUSScore, type SUSResponse } from '@/lib/feedback/sus-scoring';
import { emitSUSSurveyCompletedAsync } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { responses, triggerPoint, task } = body;

    if (!responses || !Array.isArray(responses) || responses.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid responses - must provide 10 answers' },
        { status: 400 }
      );
    }

    // Calculate SUS score
    const score = calculateSUSScore(responses as SUSResponse[]);

    // Emit analytics event
    emitSUSSurveyCompletedAsync(user.id, crypto.randomUUID(), {
      score,
      responses: responses.map((r: SUSResponse) => r.value),
      trigger_point: triggerPoint || 'periodic',
    });

    return NextResponse.json({
      success: true,
      score,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Failed to submit SUS survey:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit survey',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
