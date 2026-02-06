/**
 * GET /api/wellbeing/milestones
 *
 * Returns recent milestone events (interview, offer, rejection) for the authenticated user
 * to nudge well-being check-ins with contextual defaults.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { and, eq, inArray, gte } from 'drizzle-orm';

const MILESTONE_EVENTS = [
  'interview_completed',
  'decision_made',
  'contract_signed',
  'contract_declined',
] as const;

type MilestoneEvent = (typeof MILESTONE_EVENTS)[number];

function mapEventToMilestone(eventType: MilestoneEvent): 'interview' | 'offer' | 'rejection' | null {
  if (eventType === 'interview_completed') return 'interview';
  if (eventType === 'contract_signed') return 'offer';
  if (eventType === 'contract_declined' || eventType === 'decision_made') return 'rejection';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const daysParam = request.nextUrl.searchParams.get('days');
    const days = Number.parseInt(daysParam || '7', 10);
    const since = new Date();
    since.setDate(since.getDate() - (Number.isNaN(days) ? 7 : days));

    const rows = await db
      .select({
        eventType: analyticsEvents.eventType,
        createdAt: analyticsEvents.createdAt,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, user.id),
          inArray(analyticsEvents.eventType, [...MILESTONE_EVENTS]),
          gte(analyticsEvents.createdAt, since)
        )
      )
      .orderBy(analyticsEvents.createdAt)
      .limit(5);

    const milestones = rows
      .map((row) => ({
        type: mapEventToMilestone(row.eventType as MilestoneEvent),
        occurredAt: row.createdAt,
      }))
      .filter((m) => m.type !== null);

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error('wellbeing.milestones.failed', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}
