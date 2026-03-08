import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import {
  emitProfileActivated,
  emitReadinessStateAchieved,
  type AnalyticsEvent,
} from '@/lib/analytics/events';
import { getIndividualReadinessState, type ReadinessState } from '@/lib/readiness/individual-state';

const READINESS_EVENT_TYPES = {
  portfolio_ready: 'portfolio_ready_achieved',
  browse_ready: 'browse_ready_achieved',
  qualified_intro_ready: 'qualified_intro_ready_achieved',
  legacyBrowse: 'profile_activated',
} as const;

function buildProperties(
  snapshot: Awaited<ReturnType<typeof getIndividualReadinessState>>,
  source?: string
) {
  return {
    source: source || 'unknown',
    highest_state: snapshot.highestState,
    legacy_tier: snapshot.legacyTier,
    states: snapshot.states,
    counts: snapshot.counts,
  };
}

export async function syncReadinessMilestones(
  userId: string,
  options?: {
    source?: string;
    activationDurationMs?: number;
  }
): Promise<void> {
  const snapshot = await getIndividualReadinessState(userId);
  const existingRows = await db
    .select({
      eventType: analyticsEvents.eventType,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.userId, userId),
        inArray(analyticsEvents.eventType, [
          READINESS_EVENT_TYPES.portfolio_ready,
          READINESS_EVENT_TYPES.browse_ready,
          READINESS_EVENT_TYPES.qualified_intro_ready,
          READINESS_EVENT_TYPES.legacyBrowse,
        ])
      )
    );

  const existing = new Set(
    (Array.isArray(existingRows) ? existingRows : []).map((row) => row.eventType)
  );
  const baseProperties = buildProperties(snapshot, options?.source);

  const readyStates: ReadinessState[] = snapshot.states;
  for (const state of readyStates) {
    const eventType = READINESS_EVENT_TYPES[state];
    if (existing.has(eventType)) {
      continue;
    }
    await emitReadinessStateAchieved(userId, state, baseProperties);
  }

  if (snapshot.flags.browseReady && !existing.has(READINESS_EVENT_TYPES.legacyBrowse)) {
    await emitProfileActivated(userId, {
      ...baseProperties,
      activation_duration_ms: options?.activationDurationMs,
      activationTier: snapshot.legacyTier,
      browse_ready: true,
    });
  }
}
