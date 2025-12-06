import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { organizationFollows, organizations } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

const FollowSchema = z.object({
  notifyNewRoles: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getOrganizationBySlug(slug: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
    columns: {
      id: true,
      slug: true,
      displayName: true,
    },
  });
}

// GET /api/organizations/[slug]/follow - check follow status
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const user = await requireAuth();
    const org = await getOrganizationBySlug(slug);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const follow = await db.query.organizationFollows.findFirst({
      where: and(eq(organizationFollows.userId, user.id), eq(organizationFollows.orgId, org.id)),
    });

    const [{ count }] =
      (await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationFollows)
        .where(eq(organizationFollows.orgId, org.id))) || [];

    return NextResponse.json({
      following: !!follow,
      notifyNewRoles: follow?.notifyNewRoles ?? true,
      followerCount: count ?? 0,
    });
  } catch (error) {
    log.error('organization.follow.status.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: slug,
    });
    return NextResponse.json({ error: 'Failed to fetch follow status' }, { status: 500 });
  }
}

// POST /api/organizations/[slug]/follow - follow or update preference
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const user = await requireAuth();
    const org = await getOrganizationBySlug(slug);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const data = FollowSchema.parse(body);

    const existing = await db.query.organizationFollows.findFirst({
      where: and(eq(organizationFollows.userId, user.id), eq(organizationFollows.orgId, org.id)),
    });

    let follow;

    if (existing) {
      [follow] = await db
        .update(organizationFollows)
        .set({
          notifyNewRoles: data.notifyNewRoles ?? existing.notifyNewRoles,
        })
        .where(and(eq(organizationFollows.userId, user.id), eq(organizationFollows.orgId, org.id)))
        .returning();
    } else {
      [follow] = await db
        .insert(organizationFollows)
        .values({
          userId: user.id,
          orgId: org.id,
          notifyNewRoles: data.notifyNewRoles ?? true,
        })
        .returning();
    }

    log.info('organization.follow.saved', {
      userId: user.id,
      orgId: org.id,
      notifyNewRoles: follow.notifyNewRoles,
    });

    const [{ count }] =
      (await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationFollows)
        .where(eq(organizationFollows.orgId, org.id))) || [];

    return NextResponse.json({
      following: true,
      notifyNewRoles: follow.notifyNewRoles,
      followerCount: count ?? 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }

    log.error('organization.follow.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: slug,
    });
    return NextResponse.json({ error: 'Failed to follow organization' }, { status: 500 });
  }
}

// DELETE /api/organizations/[slug]/follow - unfollow
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const user = await requireAuth();
    const org = await getOrganizationBySlug(slug);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    await db
      .delete(organizationFollows)
      .where(and(eq(organizationFollows.userId, user.id), eq(organizationFollows.orgId, org.id)));

    log.info('organization.unfollowed', { userId: user.id, orgId: org.id });

    const [{ count }] =
      (await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationFollows)
        .where(eq(organizationFollows.orgId, org.id))) || [];

    return NextResponse.json({ following: false, followerCount: count ?? 0 });
  } catch (error) {
    log.error('organization.unfollow.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: slug,
    });
    return NextResponse.json({ error: 'Failed to unfollow organization' }, { status: 500 });
  }
}
