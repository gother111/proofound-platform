import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { organizationMembers, profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { orgId } = await params;
    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, auth.user.id),
        eq(organizationMembers.orgId, orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const rows = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        status: organizationMembers.status,
        joinedAt: organizationMembers.joinedAt,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        handle: profiles.handle,
      })
      .from(organizationMembers)
      .innerJoin(profiles, eq(profiles.id, organizationMembers.userId))
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.status, 'active')));

    return mobileSuccess({
      items: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('[mobile.organizations.team.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch organization team', 500);
  }
}
