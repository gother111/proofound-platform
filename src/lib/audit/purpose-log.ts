/**
 * Purpose Edit Audit Logging
 *
 * Immutable, append-only audit trail for mission, vision, values, and causes changes.
 * Tracks who/when/what changed for compliance and accountability.
 *
 * PRD Reference: Part 7 (line 1495)
 */

import { db } from '@/db';
import { purposeEditLog } from '@/db/schema';
import type { InsertPurposeEditLog } from '@/db/schema';

export interface PurposeEditParams {
  userId: string;
  fieldName: 'mission' | 'vision' | 'values' | 'causes';
  oldValue: string | string[] | null;
  newValue: string | string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a purpose field edit
 * This is append-only and immutable
 */
export async function logPurposeEdit(params: PurposeEditParams): Promise<void> {
  const { userId, fieldName, oldValue, newValue, ipAddress, userAgent } = params;

  try {
    // Convert values/causes arrays to JSON strings for storage
    const oldValueStr =
      oldValue === null ? null : Array.isArray(oldValue) ? JSON.stringify(oldValue) : oldValue;

    const newValueStr = Array.isArray(newValue) ? JSON.stringify(newValue) : newValue;

    const logEntry: InsertPurposeEditLog = {
      userId,
      fieldName,
      oldValue: oldValueStr,
      newValue: newValueStr,
      changedAt: new Date(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    };

    await db.insert(purposeEditLog).values(logEntry);

    console.log(`[Audit] Purpose edit logged: ${fieldName} for user ${userId}`);
  } catch (error) {
    // Log error but don't throw - audit logging failure shouldn't block user actions
    console.error('[Audit] Failed to log purpose edit:', error);
  }
}

/**
 * Get purpose edit history for a user
 */
export async function getPurposeEditHistory(
  userId: string,
  fieldName?: 'mission' | 'vision' | 'values' | 'causes',
  limit: number = 100
): Promise<any[]> {
  try {
    let query = db
      .select()
      .from(purposeEditLog)
      .where(sql`${purposeEditLog.userId} = ${userId}`)
      .orderBy(desc(purposeEditLog.changedAt))
      .limit(limit);

    if (fieldName) {
      query = query.where(
        and(
          sql`${purposeEditLog.userId} = ${userId}`,
          sql`${purposeEditLog.fieldName} = ${fieldName}`
        )
      ) as any;
    }

    const logs = await query;

    // Parse JSON strings back to arrays for values/causes
    return logs.map((log) => ({
      ...log,
      oldValue:
        log.fieldName === 'values' || log.fieldName === 'causes'
          ? log.oldValue
            ? JSON.parse(log.oldValue)
            : null
          : log.oldValue,
      newValue:
        log.fieldName === 'values' || log.fieldName === 'causes'
          ? JSON.parse(log.newValue)
          : log.newValue,
    }));
  } catch (error) {
    console.error('[Audit] Failed to fetch purpose edit history:', error);
    return [];
  }
}

// Import required for queries
import { sql, and, desc } from 'drizzle-orm';
