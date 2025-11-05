/**
 * POST /api/feedback/sus
 *
 * Submit a completed SUS survey
 * Calculates score and stores in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { susSurveys, surveyDisplayLog } from '@/db/schema';
import type { InsertSusSurvey } from '@/db/schema';
import { calculateSUSScore, type SUSResponse } from '@/lib/feedback/sus-scoring';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { responses, task, dismissed } = body;

    // If user dismissed the survey without completing
    if (dismissed) {
      // Just record that it was shown but not completed
      // This helps us track response rate
      return NextResponse.json({ success: true, dismissed: true });
    }

    // Validate responses
    if (!responses || !Array.isArray(responses) || responses.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid responses. Must provide exactly 10 responses.' },
        { status: 400 }
      );
    }

    // Calculate SUS score
    const susResult = calculateSUSScore(responses as SUSResponse[]);

    // Store survey in database
    const survey: InsertSusSurvey = {
      userId: user.id,
      task: task || null,
      responses: responses as any,
      score: String(susResult.score),
      dismissed: false,
      completedAt: new Date(),
    };

    const [created] = await db.insert(susSurveys).values(survey).returning();

    // Update survey display log to mark as completed
    await db
      .update(surveyDisplayLog)
      .set({ completed: true })
      .where(
        and(
          eq(surveyDisplayLog.userId, user.id),
          eq(surveyDisplayLog.surveyType, 'sus'),
          eq(surveyDisplayLog.completed, false)
        )
      );

    return NextResponse.json({
      success: true,
      survey: created,
      result: susResult,
    });
  } catch (error) {
    console.error('Error submitting SUS survey:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/feedback/sus
 *
 * Get user's SUS survey history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's surveys
    const surveys = await db
      .select()
      .from(susSurveys)
      .where(eq(susSurveys.userId, user.id))
      .orderBy(susSurveys.createdAt);

    return NextResponse.json({
      success: true,
      surveys,
    });
  } catch (error) {
    console.error('Error fetching SUS surveys:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
