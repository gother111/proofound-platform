import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationMembers, organizationProjects } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';

export const dynamic = 'force-dynamic';

const CreateProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  impactCreated: z.string().min(1),
  businessValue: z.string().min(1),
  outcomes: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']).optional(),
});

async function orgRole(userId: string, orgId: string) {
  return db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
    columns: { role: true },
  });
}

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
    const membership = await orgRole(auth.user.id, orgId);
    if (!membership) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const items = await db
      .select()
      .from(organizationProjects)
      .where(eq(organizationProjects.orgId, orgId));

    return mobileSuccess({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('[mobile.organizations.projects.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch projects', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { orgId } = await params;
    const membership = await orgRole(auth.user.id, orgId);
    const membershipRole = normalizeAuthorizedOrgRole(membership?.role);
    if (membershipRole !== 'org_owner') {
      return mobileError('forbidden', 'Only organization owners can create projects', 403);
    }

    const parsed = CreateProjectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid project payload',
        400,
        parsed.error.flatten()
      );
    }

    const [created] = await db
      .insert(organizationProjects)
      .values({
        orgId,
        ...parsed.data,
      })
      .returning();

    return mobileSuccess({ project: created }, 201);
  } catch (error) {
    console.error('[mobile.organizations.projects.post] failed', error);
    return mobileError('internal_error', 'Failed to create project', 500);
  }
}
