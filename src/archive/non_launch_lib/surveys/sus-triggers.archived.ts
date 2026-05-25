/**
 * SUS Survey Trigger System
 *
 * PRD: Part 2 (lines 83-84), Part 12
 * Collection points:
 * - After profile activation (I-05 complete)
 * - After first assignment creation (O-07 complete)
 * - After 10 matches viewed (I-17)
 * - Quarterly check-in for active users
 */

import { db } from '@/db';
import { susSurveyPrompts, profiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';

type SurveyTrigger = 'profile_activation' | 'first_assignment' | '10_matches' | 'quarterly_checkin';

/**
 * Create a SUS survey prompt for a user
 * Ensures we don't spam users with duplicate prompts
 */
export async function createSUSPrompt(userId: string, trigger: SurveyTrigger): Promise<void> {
  try {
    // Check if there's already a pending or recent prompt for this trigger
    const existingPrompts = await db
      .select()
      .from(susSurveyPrompts)
      .where(
        and(
          eq(susSurveyPrompts.userId, userId),
          eq(susSurveyPrompts.trigger, trigger),
          sql`${susSurveyPrompts.status} IN ('pending', 'completed')`,
          // Don't ask again if completed in the last 90 days
          sql`${susSurveyPrompts.createdAt} > NOW() - INTERVAL '90 days'`
        )
      )
      .limit(1);

    if (existingPrompts.length > 0) {
      log.info('sus_survey.prompt_skipped', {
        userId,
        trigger,
        reason: 'recent_prompt_exists',
      });
      return;
    }

    // Create the prompt
    await db.insert(susSurveyPrompts).values({
      userId,
      trigger,
      status: 'pending',
      scheduledAt: new Date(),
    });

    log.info('sus_survey.prompt_created', {
      userId,
      trigger,
    });
  } catch (error) {
    log.error('sus_survey.prompt_creation_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      trigger,
    });
  }
}

/**
 * Trigger: Profile activation (I-05 complete)
 * Called when user completes their profile setup
 */
export async function triggerProfileActivationSurvey(userId: string): Promise<void> {
  await createSUSPrompt(userId, 'profile_activation');
}

/**
 * Trigger: First assignment creation (O-07 complete)
 * Called when organization creates their first assignment
 */
export async function triggerFirstAssignmentSurvey(orgMemberId: string): Promise<void> {
  await createSUSPrompt(orgMemberId, 'first_assignment');
}

/**
 * Trigger: 10 matches viewed (I-17)
 * Called when user has viewed 10 matches
 */
export async function triggerTenMatchesSurvey(userId: string): Promise<void> {
  await createSUSPrompt(userId, '10_matches');
}

/**
 * Check if user has viewed 10 matches and should get survey
 * This should be called after each match view
 */
export async function checkTenMatchesMilestone(userId: string): Promise<void> {
  try {
    // Count how many matches the user has viewed
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT entity_id) as match_count
      FROM analytics_events
      WHERE event_type = 'match_viewed'
        AND user_id = ${userId}
    `);

    const rows = getRows(result as any) as any[];
    const matchCount = rows.length > 0 ? parseInt(rows[0].match_count) : 0;

    // Trigger survey exactly at 10 matches
    if (matchCount === 10) {
      await triggerTenMatchesSurvey(userId);
    }
  } catch (error) {
    log.error('sus_survey.ten_matches_check_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
  }
}

/**
 * Get pending SUS survey prompts for a user
 * Used to display survey modal when user logs in
 */
export async function getPendingSUSPrompts(userId: string) {
  try {
    const prompts = await db
      .select()
      .from(susSurveyPrompts)
      .where(
        and(
          eq(susSurveyPrompts.userId, userId),
          eq(susSurveyPrompts.status, 'pending'),
          // Only show prompts that are scheduled
          sql`${susSurveyPrompts.scheduledAt} <= NOW()`
        )
      )
      .orderBy(susSurveyPrompts.scheduledAt)
      .limit(1); // Only show one at a time

    return prompts[0] || null;
  } catch (error) {
    log.error('sus_survey.get_pending_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return null;
  }
}

/**
 * Mark a survey prompt as shown
 */
export async function markPromptAsShown(promptId: string): Promise<void> {
  try {
    await db
      .update(susSurveyPrompts)
      .set({
        shownAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(susSurveyPrompts.id, promptId));

    log.info('sus_survey.prompt_shown', { promptId });
  } catch (error) {
    log.error('sus_survey.mark_shown_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      promptId,
    });
  }
}

/**
 * Mark a survey prompt as skipped
 */
export async function markPromptAsSkipped(promptId: string): Promise<void> {
  try {
    await db
      .update(susSurveyPrompts)
      .set({
        status: 'skipped',
        actionedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(susSurveyPrompts.id, promptId));

    log.info('sus_survey.prompt_skipped', { promptId });
  } catch (error) {
    log.error('sus_survey.mark_skipped_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      promptId,
    });
  }
}

/**
 * Create quarterly check-in prompts for active users
 * This should be run by a cron job or background task
 */
export async function createQuarterlyCheckIns(): Promise<void> {
  try {
    // Get active users who haven't had a survey in the last 90 days
    const activeUsers = await db.execute(sql`
      SELECT DISTINCT p.id
      FROM profiles p
      LEFT JOIN sus_survey_prompts ssp ON ssp.user_id = p.id 
        AND ssp.trigger = 'quarterly_checkin'
        AND ssp.created_at > NOW() - INTERVAL '90 days'
      WHERE p.created_at < NOW() - INTERVAL '90 days' -- User active for at least 90 days
        AND ssp.id IS NULL -- No recent quarterly check-in
        AND EXISTS (
          -- User has been active in the last 30 days
          SELECT 1 FROM analytics_events ae
          WHERE ae.user_id = p.id
            AND ae.occurred_at > NOW() - INTERVAL '30 days'
          LIMIT 1
        )
      LIMIT 100 -- Process in batches
    `);

    const users = getRows(activeUsers as any) as any[];
    let created = 0;

    for (const user of users) {
      await createSUSPrompt(user.id, 'quarterly_checkin');
      created++;
    }

    log.info('sus_survey.quarterly_checkins_created', {
      total: users.length,
      created,
    });
  } catch (error) {
    log.error('sus_survey.quarterly_checkins_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
