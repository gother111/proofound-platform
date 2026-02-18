import { and, asc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const CreateAssignmentSchema = z.object({
  orgId: z.string().uuid(),
  role: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional().default('draft'),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(z.any()).optional(),
  niceToHaveSkills: z.array(z.any()).optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
});

async function resolveMembership(userId: string, orgId: string) {
  return db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.status, 'active')
    ),
    columns: {
      role: true,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const orgId = request.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return mobileError('validation_error', 'orgId query parameter is required', 400);
    }

    const membership = await resolveMembership(auth.user.id, orgId);
    if (!membership) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const status = request.nextUrl.searchParams.get('status');
    const allowedStatus = ['draft', 'active', 'paused', 'closed'];
    const statusFilter = status && allowedStatus.includes(status) ? status : null;
    const whereClause = statusFilter
      ? and(eq(assignments.orgId, orgId), eq(assignments.status, statusFilter as any))
      : eq(assignments.orgId, orgId);

    const rows = await db
      .select()
      .from(assignments)
      .where(whereClause)
      .orderBy(asc(assignments.createdAt));

    return mobileSuccess({
      items: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error('[mobile.assignments.get] failed', error);
    return mobileError('internal_error', 'Failed to load assignments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = CreateAssignmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid assignment payload',
        400,
        parsed.error.flatten()
      );
    }

    const membership = await resolveMembership(auth.user.id, parsed.data.orgId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return mobileError('forbidden', 'Only owner/admin can create assignments', 403);
    }

    const [created] = await db
      .insert(assignments)
      .values({
        ...parsed.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return mobileSuccess({ assignment: created }, 201);
  } catch (error) {
    console.error('[mobile.assignments.post] failed', error);
    return mobileError('internal_error', 'Failed to create assignment', 500);
  }
}
