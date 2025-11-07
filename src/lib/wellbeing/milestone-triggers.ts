/**
 * Zen Hub Milestone Triggers
 *
 * PRD: Part 7 (line 1596)
 * Automatically triggers reflection prompts on key events:
 * - Match rejection
 * - Interview scheduled
 * - Offer/contract signed
 */

import { db } from '@/db';
import { wellbeingReflections } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export type MilestoneType = 'rejection' | 'interview' | 'offer';

/**
 * Trigger a reflection prompt after a milestone event
 * Only triggers if user is opted into well-being tracking
 */
export async function triggerMilestoneReflection(
  userId: string,
  milestoneType: MilestoneType,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // Check if user is opted into well-being tracking
    const optIn = await checkWellBeingOptIn(userId);
    if (!optIn) {
      log.info('wellbeing.milestone.skipped_not_opted_in', {
        userId,
        milestoneType,
      });
      return;
    }

    // Create a reflection prompt notification
    // (In a full implementation, this would create a notification or in-app message)
    await createReflectionPrompt(userId, milestoneType, metadata);

    log.info('wellbeing.milestone.triggered', {
      userId,
      milestoneType,
      metadata,
    });
  } catch (error) {
    log.error('wellbeing.milestone.trigger_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      milestoneType,
    });
  }
}

/**
 * Check if user is opted into well-being tracking
 */
async function checkWellBeingOptIn(userId: string): Promise<boolean> {
  try {
    // Check if user has any well-being check-ins (indicates opt-in)
    const result = await db.execute(sql`
      SELECT EXISTS(
        SELECT 1 FROM wellbeing_checkins
        WHERE profile_id = ${userId}
        LIMIT 1
      ) as opted_in
    `);

    const rows = result.rows as any[];
    return rows[0]?.opted_in === true;
  } catch (error) {
    log.error('wellbeing.opt_in_check_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return false;
  }
}

/**
 * Create a reflection prompt for a milestone
 * This could be implemented as:
 * - A notification in the app
 * - An email
 * - A banner on the dashboard
 */
async function createReflectionPrompt(
  userId: string,
  milestoneType: MilestoneType,
  metadata?: Record<string, any>
): Promise<void> {
  // For now, we'll create a suggested reflection entry
  // In a full implementation, this might create a notification or prompt

  const prompts = {
    rejection: {
      prompt: 'You recently received a rejection. How are you feeling about this experience?',
      suggestedQuestions: [
        'What did you learn from this process?',
        'How can you use this feedback to improve?',
        'What support do you need right now?',
      ],
    },
    interview: {
      prompt: 'You have an interview coming up. How are you preparing emotionally?',
      suggestedQuestions: [
        'What are you most excited about?',
        'What concerns do you have?',
        'How can you best show up as yourself?',
      ],
    },
    offer: {
      prompt: 'Congratulations on your offer! How does this feel?',
      suggestedQuestions: [
        'Does this align with your purpose and values?',
        'What impact do you hope to make in this role?',
        'What support will help you succeed?',
      ],
    },
  };

  const promptData = prompts[milestoneType];

  // Store as a reflection template/suggestion
  // (In a full implementation, this would be in a separate table for prompts)
  await db.insert(wellbeingReflections).values({
    profileId: userId,
    content: `[Reflection Prompt] ${promptData.prompt}\n\nSuggested questions:\n${promptData.suggestedQuestions.join('\n')}`,
    mood: null,
    tags: [milestoneType, 'milestone', 'prompt'],
  });

  log.info('wellbeing.reflection_prompt.created', {
    userId,
    milestoneType,
  });
}

/**
 * Trigger reflection after match rejection
 * Called from: /api/match/interest when interest is 'not_interested'
 */
export async function triggerRejectionReflection(userId: string, matchId: string): Promise<void> {
  await triggerMilestoneReflection(userId, 'rejection', {
    matchId,
    source: 'match_rejection',
  });
}

/**
 * Trigger reflection after interview scheduled
 * Called from: /api/interviews when interview is created
 */
export async function triggerInterviewReflection(
  userId: string,
  interviewId: string,
  interviewDate: Date
): Promise<void> {
  await triggerMilestoneReflection(userId, 'interview', {
    interviewId,
    interviewDate,
    source: 'interview_scheduled',
  });
}

/**
 * Trigger reflection after offer/contract signed
 * Called from: /api/contracts when contract is signed
 */
export async function triggerOfferReflection(userId: string, contractId: string): Promise<void> {
  await triggerMilestoneReflection(userId, 'offer', {
    contractId,
    source: 'contract_signed',
  });
}
