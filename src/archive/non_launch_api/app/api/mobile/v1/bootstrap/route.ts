import { and, desc, eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { featureFlags, notifications, organizationMembers, organizations } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const [memberships, unreadResult, activeFlags] = await Promise.all([
      db
        .select({
          orgId: organizationMembers.orgId,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          orgSlug: organizations.slug,
          orgDisplayName: organizations.displayName,
          orgVerified: organizations.verified,
          orgLogoUrl: organizations.logoUrl,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
        .where(
          and(
            eq(organizationMembers.userId, auth.user.id),
            eq(organizationMembers.status, 'active')
          )
        )
        .orderBy(desc(organizationMembers.joinedAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, auth.user.id), eq(notifications.read, false))),
      db
        .select({
          key: featureFlags.key,
          enabled: featureFlags.enabled,
        })
        .from(featureFlags)
        .where(eq(featureFlags.enabled, true)),
    ]);

    return mobileSuccess({
      sessionUser: {
        id: auth.user.id,
        email: auth.user.email ?? null,
      },
      profile: auth.profile,
      personaContext: {
        persona: auth.profile?.persona ?? 'unknown',
        locale: auth.profile?.locale ?? 'en',
        organizations: memberships.map((membership) => ({
          id: membership.orgId,
          slug: membership.orgSlug,
          displayName: membership.orgDisplayName,
          role: membership.role,
          verified: membership.orgVerified,
          logoUrl: membership.orgLogoUrl,
        })),
      },
      unreadCounts: {
        notifications: unreadResult[0]?.count ?? 0,
      },
      featureFlags: activeFlags,
    });
  } catch (error) {
    console.error('[mobile.bootstrap] failed', error);
    return mobileError('internal_error', 'Failed to load bootstrap payload', 500);
  }
}
