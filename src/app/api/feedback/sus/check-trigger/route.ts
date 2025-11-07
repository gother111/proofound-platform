/**
 * SUS Survey Trigger Check API
 * GET/POST /api/feedback/sus/check-trigger
 *
 * Checks if user should be shown a SUS survey based on:
 * - Profile activation
 * - First match acceptance
 * - Contract signing
 * - Time since last survey (periodic)
 *
 * PRD References:
 * - Part 2: SUS target ≥75
 * - Part 7: Survey triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { EventType } from '@/lib/analytics/constants';

export const dynamic = 'force-dynamic';

type TriggerPoint = 'post_activation' | 'post_match' | 'post_contract' | 'periodic';

/**
 * GET: Check if there's a pending survey to show
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const triggerPoint = await determineTriggerPoint(user.id);

    return NextResponse.json({
      shouldShow: triggerPoint !== null,
      triggerPoint,
      userId: user.id,
    });
  } catch (error) {
    console.error('Failed to check SUS trigger:', error);
    return NextResponse.json({ shouldShow: false }, { status: 200 });
  }
}

/**
 * POST: Check if survey should be shown after a specific event
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { event } = body;

    if (!event || !['post_activation', 'post_match', 'post_contract'].includes(event)) {
      return NextResponse.json({ error: 'Invalid trigger event' }, { status: 400 });
    }

    const shouldShow = await shouldShowSurveyForEvent(user.id, event);

    return NextResponse.json({
      shouldShow,
      triggerPoint: shouldShow ? event : null,
      userId: user.id,
    });
  } catch (error) {
    console.error('Failed to check SUS trigger:', error);
    return NextResponse.json({ shouldShow: false }, { status: 200 });
  }
}

/**
 * Determine if user should see a survey based on their lifecycle stage
 */
async function determineTriggerPoint(userId: string): Promise<TriggerPoint | null> {
  try {
    // Check if user has completed SUS surveys before
    const completedSurveys = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.SUS_SURVEY_COMPLETED)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt));

    // Get user's lifecycle events
    const [profileActivated, firstIntro, contractSigned] = await Promise.all([
      db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            eq(analyticsEvents.eventType, EventType.PROFILE_ACTIVATED)
          )
        )
        .limit(1),
      db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            eq(analyticsEvents.eventType, EventType.FIRST_QUALIFIED_INTRO)
          )
        )
        .limit(1),
      db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            eq(analyticsEvents.eventType, EventType.CONTRACT_SIGNED)
          )
        )
        .limit(1),
    ]);

    // Priority 1: Post-contract (if not already surveyed)
    if (contractSigned.length > 0) {
      const contractSurvey = completedSurveys.find(
        (s) => (s.properties as any)?.trigger_point === 'post_contract'
      );
      if (
        !contractSurvey &&
        contractSigned[0].createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) {
        return 'post_contract';
      }
    }

    // Priority 2: Post-match (if not already surveyed)
    if (firstIntro.length > 0) {
      const matchSurvey = completedSurveys.find(
        (s) => (s.properties as any)?.trigger_point === 'post_match'
      );
      if (
        !matchSurvey &&
        firstIntro[0].createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) {
        return 'post_match';
      }
    }

    // Priority 3: Post-activation (if not already surveyed)
    if (profileActivated.length > 0) {
      const activationSurvey = completedSurveys.find(
        (s) => (s.properties as any)?.trigger_point === 'post_activation'
      );
      if (
        !activationSurvey &&
        profileActivated[0].createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) {
        return 'post_activation';
      }
    }

    // Priority 4: Periodic (every 30 days if user is active)
    if (completedSurveys.length > 0) {
      const lastSurvey = completedSurveys[0];
      const daysSinceLastSurvey =
        (Date.now() - lastSurvey.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastSurvey > 30) {
        return 'periodic';
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to determine trigger point:', error);
    return null;
  }
}

/**
 * Check if survey should be shown immediately after an event
 */
async function shouldShowSurveyForEvent(userId: string, event: TriggerPoint): Promise<boolean> {
  try {
    // Check if user has already completed a survey for this trigger
    const completedSurveys = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, EventType.SUS_SURVEY_COMPLETED)
        )
      );

    const alreadyCompleted = completedSurveys.some(
      (s) => (s.properties as any)?.trigger_point === event
    );

    return !alreadyCompleted;
  } catch (error) {
    console.error('Failed to check event trigger:', error);
    return false;
  }
}
