import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { getOrganizationReadiness, resolveOrganizationId } from '@/lib/readiness/organization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
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
          eq(organizationMembers.status, 'active')
        )
      );

    if ((membership[0]?.total ?? 0) === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const readiness = await getOrganizationReadiness(orgId);
    return NextResponse.json(readiness);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to build organization readiness',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
