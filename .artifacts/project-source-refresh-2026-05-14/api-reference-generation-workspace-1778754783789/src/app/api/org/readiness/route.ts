import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { requireApiAuthContext } from '@/lib/auth';
import { safeApiErrorResponse } from '@/lib/api/errors';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import {
  getOrganizationReadiness,
  getOrganizationReadinessCached,
  resolveOrganizationId,
} from '@/lib/readiness/organization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const orgRef = request.nextUrl.searchParams.get('org');

    if (!orgRef) {
      return NextResponse.json({ error: 'org query param is required' }, { status: 400 });
    }

    const orgId = await resolveOrganizationId(orgRef);

    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const membership = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.state, 'active')
        )
      );

    if ((membership[0]?.total ?? 0) === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const usePerfCache = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.PLATFORM_PERF_CACHE,
      { userId: user.id, orgId },
      true
    );
    const readiness = usePerfCache
      ? await getOrganizationReadinessCached(orgId)
      : await getOrganizationReadiness(orgId);
    return NextResponse.json(readiness);
  } catch (error) {
    return safeApiErrorResponse({
      event: 'org.readiness.failed',
      error,
      status: 500,
      publicMessage: 'Failed to build organization readiness',
    });
  }
}
