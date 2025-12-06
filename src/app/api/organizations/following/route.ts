import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { organizationFollows, organizations } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// GET /api/organizations/following - list organizations the user follows
export async function GET(_request: NextRequest) {
  try {
    const user = await requireAuth();

    const items = await db
      .select({
        orgId: organizations.id,
        slug: organizations.slug,
        displayName: organizations.displayName,
        tagline: organizations.tagline,
        logoUrl: organizations.logoUrl,
        industry: organizations.industry,
        impactArea: organizations.impactArea,
        causes: organizations.causes,
        values: organizations.values,
        notifyNewRoles: organizationFollows.notifyNewRoles,
      })
      .from(organizationFollows)
      .innerJoin(organizations, eq(organizationFollows.orgId, organizations.id))
      .where(eq(organizationFollows.userId, user.id))
      .orderBy(organizations.displayName);

    return NextResponse.json({ items });
  } catch (error) {
    log.error('organization.following.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to load followed organizations' }, { status: 500 });
  }
}
