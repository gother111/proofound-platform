import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import {
  getIndividualActivityEvents,
  getOrganizationActivityEvents,
  getUnreadNotificationCount,
} from '@/lib/momentum/activity';
import { getIndividualReadiness } from '@/lib/readiness/individual';
import { getOrganizationReadiness, resolveOrganizationId } from '@/lib/readiness/organization';
import { getOrSetTtlCache, PLATFORM_PERF_CACHE_TTL_MS } from '@/lib/performance/ttl-cache';
import type { ActivityEvent, MomentumSummary } from '@/lib/momentum/types';

const MOMENTUM_SUMMARY_CACHE_PREFIX = 'momentum:summary';
const MOMENTUM_UPDATES_CACHE_PREFIX = 'momentum:updates';

type MomentumPersona = 'individual' | 'organization';

export type MomentumUpdatesPayload = {
  persona: MomentumPersona;
  updates: ActivityEvent[];
};

export async function getMomentumSummaryForIndividual(userId: string): Promise<MomentumSummary> {
  const [readiness, updates, unreadCount] = await Promise.all([
    getIndividualReadiness(userId),
    getIndividualActivityEvents(userId, 8),
    getUnreadNotificationCount(userId),
  ]);

  return {
    persona: 'individual',
    marketActivityLow: readiness.marketActivityLow,
    summary: readiness.marketActivityLow
      ? 'Market activity is currently low. Focus on readiness actions to improve match quality as volume grows.'
      : 'You have healthy market activity. Keep progressing your readiness actions to convert opportunities faster.',
    topActions: readiness.topActions,
    updates,
    metrics: {
      readinessScore: readiness.readinessScore,
      totalMatches: readiness.metrics.totalMatches,
      highQualityMatches: readiness.metrics.highQualityMatches,
      pendingVerifications: readiness.metrics.pendingVerifications,
      unreadNotifications: unreadCount,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getMomentumSummaryForOrganization(
  userId: string,
  orgRef?: string
): Promise<MomentumSummary> {
  const resolvedOrgId = orgRef ? await resolveOrganizationId(orgRef) : null;

  if (!resolvedOrgId) {
    return {
      persona: 'organization',
      marketActivityLow: true,
      summary:
        'No explicit organization context found. Open a specific organization to view hiring readiness insights.',
      topActions: [
        {
          id: 'open-org-context',
          title: 'Open an organization',
          description:
            'Organization readiness and candidate pipeline insights require an explicit organization context.',
          priority: 'high',
          category: 'assignment',
          actionUrl: '/app/o',
        },
      ],
      updates: [],
      metrics: {
        readinessScore: 0,
        totalMatches: 0,
        activeAssignments: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const hasMembership = await db
    .select({ total: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.orgId, resolvedOrgId),
        eq(organizationMembers.state, 'active')
      )
    );

  if ((hasMembership[0]?.total ?? 0) === 0) {
    return {
      persona: 'organization',
      marketActivityLow: true,
      summary: 'You do not have access to this organization context.',
      topActions: [],
      updates: [],
      metrics: {
        readinessScore: 0,
        totalMatches: 0,
        activeAssignments: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const [readiness, updates] = await Promise.all([
    getOrganizationReadiness(resolvedOrgId),
    getOrganizationActivityEvents(resolvedOrgId, 8),
  ]);

  return {
    persona: 'organization',
    marketActivityLow: readiness.marketActivityLow,
    summary: readiness.marketActivityLow
      ? 'Candidate volume is currently low. Assignment readiness and talent-availability tuning will improve pipeline quality.'
      : 'Pipeline activity is healthy. Focus on readiness actions to accelerate shortlist and interview conversion.',
    topActions: readiness.topActions,
    updates,
    metrics: {
      readinessScore: readiness.readinessScore,
      totalMatches: readiness.metrics.totalMatches,
      shortlists: readiness.metrics.shortlists,
      activeAssignments: readiness.metrics.activeAssignments,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getMomentumSummary(
  userId: string,
  persona: MomentumPersona,
  orgRef?: string
): Promise<MomentumSummary> {
  if (persona === 'organization') {
    return getMomentumSummaryForOrganization(userId, orgRef);
  }

  return getMomentumSummaryForIndividual(userId);
}

export async function getMomentumSummaryCached(
  userId: string,
  persona: MomentumPersona,
  orgRef?: string
): Promise<MomentumSummary> {
  return getOrSetTtlCache(
    `${MOMENTUM_SUMMARY_CACHE_PREFIX}:${persona}:${userId}:${orgRef ?? ''}`,
    () => getMomentumSummary(userId, persona, orgRef),
    { ttlMs: PLATFORM_PERF_CACHE_TTL_MS }
  );
}

export async function getMomentumUpdatesForPersona(
  userId: string,
  persona: MomentumPersona,
  limit: number,
  orgRef?: string
): Promise<MomentumUpdatesPayload> {
  if (persona === 'organization') {
    const resolvedOrgId = orgRef ? await resolveOrganizationId(orgRef) : null;

    if (!resolvedOrgId) {
      return { persona, updates: [] };
    }

    return {
      persona,
      updates: await getOrganizationActivityEvents(resolvedOrgId, limit),
    };
  }

  return {
    persona,
    updates: await getIndividualActivityEvents(userId, limit),
  };
}

export async function getMomentumUpdatesForPersonaCached(
  userId: string,
  persona: MomentumPersona,
  limit: number,
  orgRef?: string
): Promise<MomentumUpdatesPayload> {
  return getOrSetTtlCache(
    `${MOMENTUM_UPDATES_CACHE_PREFIX}:${persona}:${userId}:${orgRef ?? ''}:${limit}`,
    () => getMomentumUpdatesForPersona(userId, persona, limit, orgRef),
    { ttlMs: PLATFORM_PERF_CACHE_TTL_MS }
  );
}
