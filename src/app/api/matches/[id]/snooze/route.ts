/**
 * Match Snooze API
 *
 * Allows users to temporarily hide matches and have them reappear later.
 * PRD Reference: Part 5 F4 - Matching Hub with Snooze functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { emitAnalyticsEvent } from '@/lib/analytics/events';

interface SnoozeParams {
  duration?: number; // Days (7, 14, 30)
  until?: string; // ISO date string for custom date
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id: matchId } = await params;
    const body: SnoozeParams = await request.json();

    // Validate input
    if (!body.duration && !body.until) {
      return NextResponse.json(
        { error: 'Either duration or until date is required' },
        { status: 400 }
      );
    }

    // Calculate snooze date
    let snoozeUntil: Date;
    if (body.until) {
      snoozeUntil = new Date(body.until);
      if (isNaN(snoozeUntil.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    } else {
      snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + (body.duration || 7));
    }

    // Verify match belongs to user
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.profileId, user.id)),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 });
    }

    // Update snooze timestamp
    await db
      .update(matches)
      .set({ snoozedUntil: snoozeUntil })
      .where(and(eq(matches.id, matchId), eq(matches.profileId, user.id)));

    // Emit analytics event
    await emitAnalyticsEvent({
      eventType: 'match_snoozed',
      userId: user.id,
      properties: {
        matchId,
        duration: body.duration,
        snoozeUntil: snoozeUntil.toISOString(),
      },
    });

    log.info('match.snoozed', {
      userId: user.id,
      matchId,
      snoozeUntil: snoozeUntil.toISOString(),
    });

    return NextResponse.json({
      success: true,
      snoozeUntil: snoozeUntil.toISOString(),
    });
  } catch (error) {
    log.error('match.snooze.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to snooze match' }, { status: 500 });
  }
}

/**
 * Remove snooze (unsnooze)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id: matchId } = await params;

    // Verify match belongs to user
    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.profileId, user.id)),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found or unauthorized' }, { status: 404 });
    }

    // Clear snooze timestamp
    await db
      .update(matches)
      .set({ snoozedUntil: null })
      .where(and(eq(matches.id, matchId), eq(matches.profileId, user.id)));

    // Emit analytics event
    await emitAnalyticsEvent({
      eventType: 'match_actioned',
      userId: user.id,
      properties: {
        matchId,
        action: 'unsnoozed',
      },
    });

    log.info('match.unsnoozed', {
      userId: user.id,
      matchId,
    });

    // Make sure the matching page refetches fresh data after unsnooze
    revalidatePath('/app/i/matching');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    log.error('match.unsnooze.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to unsnooze match' }, { status: 500 });
  }
}
