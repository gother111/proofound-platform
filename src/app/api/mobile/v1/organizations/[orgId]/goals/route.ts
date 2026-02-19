import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { organizationGoals, organizationMembers } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const CreateGoalSchema = z.object({
  goalType: z.enum(['sustainability', 'diversity', 'innovation', 'growth', 'impact', 'other']),
  title: z.string().min(1),
  description: z.string().min(1),
  targetDate: z.string().nullable().optional(),
  currentProgress: z.string().nullable().optional(),
  metrics: z.string().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'achieved', 'abandoned']).optional(),
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

    const goals = await db
      .select()
      .from(organizationGoals)
      .where(eq(organizationGoals.orgId, orgId));

    return mobileSuccess({
      items: goals,
      count: goals.length,
    });
  } catch (error) {
    console.error('[mobile.organizations.goals.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch goals', 500);
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
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return mobileError('forbidden', 'Only owner/admin can create goals', 403);
    }

    const parsed = CreateGoalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError('validation_error', 'Invalid goal payload', 400, parsed.error.flatten());
    }

    const [created] = await db
      .insert(organizationGoals)
      .values({
        orgId,
        ...parsed.data,
      })
      .returning();

    return mobileSuccess({ goal: created }, 201);
  } catch (error) {
    console.error('[mobile.organizations.goals.post] failed', error);
    return mobileError('internal_error', 'Failed to create goal', 500);
  }
}
