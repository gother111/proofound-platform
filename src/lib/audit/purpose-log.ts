/**
 * Purpose Edit Audit Logging
 *
 * PRD: Part 2 - Purpose Block auditing requirement
 * Tracks changes to mission and vision fields for compliance and transparency
 */

import { db } from '@/db';
import { purposeEditLog } from '@/db/schema';
import { log } from '@/lib/log';

type PurposeEditRow = typeof purposeEditLog.$inferSelect;
import { and, eq, desc } from 'drizzle-orm';

/**
 * Log a change to mission or vision field
 * This is an append-only log - no updates or deletes
 */
export async function logPurposeEdit(
  userId: string,
  fieldName: 'mission' | 'vision',
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  try {
    // Only log if there's an actual change
    if (oldValue === newValue) {
      return;
    }

    await db.insert(purposeEditLog).values({
      userId,
      fieldName,
      oldValue,
      newValue,
      changedAt: new Date(),
    });

    log.info('purpose_edit.logged', {
      userId,
      fieldName,
      oldLength: oldValue?.length || 0,
      newLength: newValue?.length || 0,
      isCreation: oldValue === null || oldValue === '',
      isDeletion: newValue === null || newValue === '',
    });
  } catch (error) {
    log.error('purpose_edit.log_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      fieldName,
    });
    // Don't throw - logging failures shouldn't break profile updates
  }
}

/**
 * Get purpose edit history for a user
 * Returns changes in reverse chronological order
 */
export async function getPurposeEditHistory(
  userId: string,
  fieldName?: 'mission' | 'vision',
  limit: number = 50
) {
  try {
    const whereClause = fieldName
      ? and(eq(purposeEditLog.userId, userId), eq(purposeEditLog.fieldName, fieldName))
      : eq(purposeEditLog.userId, userId);

    const history = await db
      .select()
      .from(purposeEditLog)
      .where(whereClause)
      .orderBy(desc(purposeEditLog.changedAt))
      .limit(limit);

    return history;
  } catch (error) {
    log.error('purpose_edit.get_history_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return [];
  }
}

/**
 * Get summary statistics for a user's purpose edits
 */
export async function getPurposeEditStats(userId: string) {
  try {
    const history = await getPurposeEditHistory(userId);

    const missionEdits = history.filter((h: PurposeEditRow) => h.fieldName === 'mission');
    const visionEdits = history.filter((h: PurposeEditRow) => h.fieldName === 'vision');

    return {
      totalEdits: history.length,
      missionEdits: missionEdits.length,
      visionEdits: visionEdits.length,
      firstEdit: history[history.length - 1]?.changedAt || null,
      lastEdit: history[0]?.changedAt || null,
    };
  } catch (error) {
    log.error('purpose_edit.get_stats_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
    return {
      totalEdits: 0,
      missionEdits: 0,
      visionEdits: 0,
      firstEdit: null,
      lastEdit: null,
    };
  }
}
