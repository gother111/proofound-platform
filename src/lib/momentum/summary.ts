import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import {
  getIndividualActivityEvents,
  getLatestOrgIdForUser,
  getOrganizationActivityEvents,
  getUnreadNotificationCount,
} from '@/lib/momentum/activity';
import { getIndividualReadiness } from '@/lib/readiness/individual';
import { getOrganizationReadiness, resolveOrganizationId } from '@/lib/readiness/organization';
import type { MomentumSummary } from '@/lib/momentum/types';

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
  const resolvedOrgId = orgRef
    ? await resolveOrganizationId(orgRef)
    : await getLatestOrgIdForUser(userId);

  if (!resolvedOrgId) {
    return {
      persona: 'organization',
      marketActivityLow: true,
      summary:
        'No active organization context found. Join or create an organization to unlock hiring readiness insights.',
      topActions: [
        {
          id: 'open-org-setup',
          title: 'Create or join an organization',
          description:
            'Organization setup unlocks assignment readiness and candidate pipeline insights.',
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
        eq(organizationMembers.status, 'active')
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
  persona: 'individual' | 'organization',
  orgRef?: string
): Promise<MomentumSummary> {
  if (persona === 'organization') {
    return getMomentumSummaryForOrganization(userId, orgRef);
  }

  return getMomentumSummaryForIndividual(userId);
}
